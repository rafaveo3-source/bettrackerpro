import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// ==========================================
// 🧠 MOTOR ATUARIAL INSTITUCIONAL (POISSON PURE)
// ==========================================
const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);

const poissonPDF = (lambda: number, k: number) => (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);

const poissonCDF = (lambda: number, k: number) => {
    let sum = 0;
    for (let i = 0; i <= k; i++) sum += poissonPDF(lambda, i);
    return sum;
};

const findLambdaForProb = (targetProb: number, k: number): number => {
    let low = 0.01;
    let high = 10.0; 
    const safeTarget = Math.min(Math.max(targetProb, 0.01), 0.99); 
    
    for (let iter = 0; iter < 20; iter++) {
        let mid = (low + high) / 2;
        let currentProb = 1 - poissonCDF(mid, k); 
        
        if (currentProb < safeTarget) low = mid; 
        else high = mid;
    }
    return (low + high) / 2;
};

const getMarketVolatilityPenalty = (market: string) => {
  const m = market.toLowerCase();
  if (m.includes('1º tempo') || m.includes('1o tempo') || m.includes('(ht)') || m.includes('primeiro tempo')) {
      if (m.includes('escanteios') || m.includes('cantos') || m.includes('race')) return 0.92; 
      return 0.95; 
  }
  if (m.includes('ambos') || m.includes('btts') || m.includes('race')) return 0.96;
  if (m.includes('escanteios') || m.includes('cantos')) return 0.97;
  if (m.includes('gols') || m.includes('gol')) return 0.98;
  return 1;
};

// 🌍 PRIORS GLOBAIS FRACOS
const getGlobalWeakPriors = (market: string) => {
  const mkt = market.toLowerCase();
  let alpha = 2.0; 
  let beta = 2.0;

  if (mkt.includes('gol') || mkt.includes('gols')) {
      if (mkt.includes('1.5') && !mkt.includes('ht') && !mkt.includes('1º')) { alpha = 2.9; beta = 1.1; } 
      else if (mkt.includes('0.5') && (mkt.includes('ht') || mkt.includes('1º'))) { alpha = 2.6; beta = 1.4; } 
      else if (mkt.includes('2.5')) { alpha = 2.0; beta = 2.0; } 
      else { alpha = 2.4; beta = 1.6; }
  } else if (mkt.includes('ambos') || mkt.includes('btts') || mkt.includes('marcam')) { alpha = 2.2; beta = 1.8; } 
  else if (mkt.includes('escanteio') || mkt.includes('canto')) { alpha = 2.2; beta = 1.8; }
  
  return { alpha, beta };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production') {
      if (origin && !origin.includes('bettrackerpro.com.br')) return res.status(403).json({ error: 'Acesso negado.' });
    } else {
      if (origin && !origin.includes('localhost') && !origin.includes('bettrackerpro.com.br')) return res.status(403).json({ error: 'Acesso negado no teste.' });
    }

    const { images, email, markets } = req.body; 
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(401).json({ error: 'Acesso não autorizado.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.2 }, 
    });

    const isSingleMarket = markets && markets.length === 1;
    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    const crossMarketInstruction = isSingleMarket
      ? `- 🛑 REGRA DE MERCADO ÚNICO: Não repita lógicas óbvias. Varie as linhas para mitigar o desconto da casa (Ex: Cruce equipe vs partida, ou HT vs FT).`
      : `- 🛑 REGRA DE CROSS-MARKET: Priorize cruzar mercados diferentes (Ex: Gols + Escanteios) para evitar o bloqueio e o desconto do 'Same Game Multiplier'.`;

    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    // 🔥 LOOP DE AUTO-HEALING
    let finalValidJson = null;
    let attempts = 0;
    let lastInternalError = "";

    while (attempts < 2 && !finalValidJson) {
      attempts++;
      
      const prompt = `Você é um Analista Quantitativo HFT Institucional.
🎯 META DE ODD E PROBABILIDADE: A Odd Justa Final deve ficar IDEALMENTE entre @1.60 e @2.00. Priorize linhas com probabilidade acima de 65%.
${lastInternalError ? `\n⚠️ ATENÇÃO - CORREÇÃO OBRIGATÓRIA DA TENTATIVA ANTERIOR: ${lastInternalError}\n` : ''}

⚙️ MOTOR MATEMÁTICO E LEITURA VISUAL:
1. NÃO invente números. Use o Hit Rate real (%).
2. ⚖️ VALIDAÇÃO CRUZADA (MUITO IMPORTANTE): Se você sugerir um mercado de equipe (Ex: Gols do Time A), você DEVE obrigatoriamente calcular a MÉDIA entre o % de sucesso do Ataque do Time A e o % de fracasso da Defesa do Time B. 
3. 🔎 CAÇADOR DE ODDS (SINGLE BET): Procure ativamente nas tabelas de Odds da imagem.
   - 🛑 REGRA DE OURO: Para sugerir uma Aposta Simples, a ODD DEVE ESTAR VISÍVEL NUMERICAMENTE na imagem (Ex: 1.72).
   - Se a coluna da odd estiver com um traço "-" ou vazia para aquele mercado, É ESTRITAMENTE PROIBIDO sugeri-lo como aposta simples. NUNCA ALUCINE OU INVENTE UMA ODD.
   - Se você encontrar UMA ÚNICA linha com probabilidade alta (ex: > 70% APÓS a média cruzada) E a ODD VISÍVEL for entre @1.60 e @2.00, CONSTRUA UMA APOSTA SIMPLES.
   - Se não houver odds numéricas visíveis que atendam à meta, construa OBRIGATORIAMENTE uma DUPLA.

⚠️ REGRAS DE MERCADO E LIQUIDEZ:
- Use apenas: [ ${selectedMarketsStr} ].
- 🛑 LINHAS DE LIQUIDEZ: Para Gols, prefira 0.5 a 3.5. Para Escanteios, 6.5 a 11.5. Mínimo exigido: 3.5 para times e 6.5 para partida.
${crossMarketInstruction}

⚠️ REGRAS DE UX E FORMATAÇÃO (MUITO IMPORTANTE):
As chaves "alternativeCombination", "conservativeCombination" e "analysis" devem conter APENAS TEXTO HUMANO. Use "\\n\\n" para separar os 3 parágrafos da analysis.
- 🛑 REGRA ANTI-SINÔNIMOS PARA ALTERNATIVA: A "alternativeCombination" DEVE ter uma estrutura LOGICAMENTE DIFERENTE da aposta principal. É ESTRITAMENTE PROIBIDO sugerir "sinônimos matemáticos" (Ex: Se a principal for "Ambas Marcam", JAMAIS sugira "Mais de 0.5 Gols Time A + Mais de 0.5 Gols Time B", pois é exatamente a mesma coisa). Mude de mercado (ex: vá para Escanteios se a principal foi Gols) ou sugira um Game Script totalmente oposto.

Retorne ESTRITAMENTE um JSON válido neste formato:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Equipe da Casa - Mais de 5.5 Escanteios",
      "prob": 80,
      "sampleSize": 10,
      "sourceExcerpt": "Odd de 1.72 visível na tabela.",
      "extractedOdd": 1.72,
      "divergenceRisk": false
    }
  ],
  "alternativeCombination": "Texto livre sugerindo tática estruturalmente DIFERENTE e sem redundância.",
  "conservativeCombination": "Texto livre sugerindo opção mais segura reduzindo linhas.",
  "analysis": "📊 A Lógica dos Números: O Hit rate é...\\n\\n⚽ Leitura de Jogo (Game Script): Esperamos que...\\n\\n🎯 Risco e Retorno: A odd lida aponta valor..."
}`;

      const result = await model.generateContent([prompt, ...imageParts]);
      let responseText = result.response.text();
      const matchJson = responseText.match(/\{[\s\S]*\}/);
      if (!matchJson) { lastInternalError = "JSON inválido."; continue; }

      let json;
      try { json = JSON.parse(matchJson[0]); } catch { lastInternalError = "JSON quebrado."; continue; }

      let hasLiquidityError = false;
      if (json.selections && Array.isArray(json.selections)) {
        for (let sel of json.selections) {
          const mkt = (sel.market || '').toLowerCase();
          const matchStr = (sel.match || '').toLowerCase();
          const parts = matchStr.split(/\s*(vs|x|-)\s*/i);
          const home = parts.length >= 3 ? parts[0].trim() : '';
          const away = parts.length >= 3 ? parts[2].trim() : '';
          const isTeamMarket = (home && mkt.includes(home)) || (away && mkt.includes(away)) || (!mkt.includes('partida') && !mkt.includes('jogo') && !mkt.includes('total') && !mkt.includes('ambos'));

          if (mkt.includes('escanteio') || mkt.includes('canto')) {
            const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
            if (lineMatch) {
              const line = parseFloat(lineMatch[1]);
              if (isTeamMarket && line < 3.5) { lastInternalError = `Mínimo de cantos equipe é 3.5.`; hasLiquidityError = true; break; }
              if (!isTeamMarket && line < 6.5) { lastInternalError = `Mínimo de cantos partida é 6.5.`; hasLiquidityError = true; break; }
            }
          }
        }
      }

      if (hasLiquidityError) continue; 
      finalValidJson = json; 
    }

    if (!finalValidJson) {
      finalValidJson = {
        selections: [ { match: "Análise Interrompida", market: "Mercados sem liquidez", prob: 0, sampleSize: 0, sourceExcerpt: "Fallback", divergenceRisk: false } ],
        combinedProb: 0, fairOdd: 0, structuralRiskScore: 5, riskLevel: "ALTO", minProb: 0, maxProb: 0,
        alternativeCombination: "Aguarde o jogo entrar no Ao Vivo para melhores liquidez.",
        conservativeCombination: "Tente selecionar múltiplas categorias (Gols + Cantos).",
        analysis: "📊 A Lógica dos Números: As linhas extraídas possuem risco assimétrico.\n\n⚽ Leitura de Jogo: Motor abortou.\n\n🎯 Risco e Retorno: Proteja seu capital."
      };
    }

    const json = finalValidJson;

    // ==========================================
    // 🧮 PASSO 1: CALCULAR PROBABILIDADES INDIVIDUAIS (BAYESIAN)
    // ==========================================
    let legs = json.selections.map((sel: any) => {
        let statedProb = (Number(sel.prob) || 75) / 100;
        let sampleSize = Number(sel.sampleSize) || 10;
        if (sampleSize < 1) sampleSize = 10;

        let hits = Math.round(statedProb * sampleSize);
        const { alpha, beta } = getGlobalWeakPriors(sel.market || '');
        let rawProb = (hits + alpha) / (sampleSize + alpha + beta);
        
        const mkt = (sel.market || '').toLowerCase();
        let line = null;
        const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
        if (lineMatch) line = parseFloat(lineMatch[1]);

        const matchStr = (sel.match || '').toLowerCase();
        const parts = matchStr.split(/\s*(vs|x|-)\s*/i);
        const home = parts.length >= 3 ? parts[0].trim() : '';
        const away = parts.length >= 3 ? parts[2].trim() : '';
        const isTeamMarket = (home && mkt.includes(home)) || (away && mkt.includes(away)) || (!mkt.includes('partida') && !mkt.includes('jogo') && !mkt.includes('total') && !mkt.includes('ambos'));

        return { ...sel, rawProb, line, mkt, isTeamMarket, sampleSize };
    });

    let rawCombinedProb = 1;
    let structuralRiskScore = 0;
    let dynamicCorrelationPenalty = 1.0; 
    let usedPoissonJoint = false;

    // 🔥 VERIFICAÇÃO DE APOSTA SIMPLES (SINGLE BET)
    const isSingleBet = legs.length === 1;

    // ==========================================
    // 🧠 PASSO 2: INFERÊNCIA ESTRUTURAL (POISSON / CORRELAÇÃO)
    // ==========================================
    if (!isSingleBet) {
        const hasHTGoals = legs.some((l: any) => (l.mkt.includes('(ht)') || l.mkt.includes('1º')) && (l.mkt.includes('gol') || l.mkt.includes('gols')));
        const hasFTGoals = legs.some((l: any) => (l.mkt.includes('(ft)') || l.mkt.includes('partida') || l.mkt.includes('jogo')) && (l.mkt.includes('gol') || l.mkt.includes('gols')));
        const isDoubleOverGoals = hasHTGoals && hasFTGoals && legs.length === 2;

        if (isDoubleOverGoals) {
            const htLeg = legs.find((l: any) => l.mkt.includes('(ht)') || l.mkt.includes('1º'));
            const ftLeg = legs.find((l: any) => l.mkt.includes('(ft)') || l.mkt.includes('partida') || l.mkt.includes('jogo'));

            if (htLeg && ftLeg && htLeg.line !== null && ftLeg.line !== null) {
                const targetHT = Math.floor(htLeg.line); 
                const targetFT = Math.floor(ftLeg.line); 

                const lambda_HT = findLambdaForProb(htLeg.rawProb, targetHT);
                const lambda_FT = findLambdaForProb(ftLeg.rawProb, targetFT);
                const lambda_2T = Math.max(0.1, lambda_FT - lambda_HT);

                let pureJointProbability = 0;
                for (let i = targetHT + 1; i <= 7; i++) { 
                    const prob_i_gols_no_HT = poissonPDF(lambda_HT, i);
                    const gols_necessarios_2T = Math.max(0, (targetFT + 1) - i);
                    const prob_bater_resto_no_2T = 1 - poissonCDF(lambda_2T, gols_necessarios_2T - 1);
                    pureJointProbability += (prob_i_gols_no_HT * prob_bater_resto_no_2T);
                }

                rawCombinedProb = pureJointProbability;
                usedPoissonJoint = true;
                structuralRiskScore += 3; 
            }
        }
    }

    // ==========================================
    // 🛡️ PASSO 3: PENALIDADES DE LIQUIDEZ E CORRELAÇÃO SECUNDÁRIA
    // ==========================================
    let totalPenalty = 1;
    let implicitCorrelationFlag = false;

    legs.forEach((leg: any) => {
        let multipliers = [];
        const excerpt = leg.sourceExcerpt || '';
        if (!/\d/.test(excerpt)) multipliers.push(0.85);
        if (leg.divergenceRisk || (leg.isTeamMarket && leg.rawProb > 0.75)) multipliers.push(0.95);
        if (leg.rawProb > 0.85) multipliers.push(0.97);

        if (leg.line !== null) {
            if (leg.mkt.includes('escanteio') || leg.mkt.includes('canto')) {
                if (leg.isTeamMarket && leg.line < 4.5) multipliers.push(0.92); 
                if (!leg.isTeamMarket && leg.line < 8.5) multipliers.push(0.95); 
            } else if (leg.mkt.includes('gol')) {
                if (leg.line < 1.0 && !leg.mkt.includes('ht') && !leg.mkt.includes('1º')) multipliers.push(0.88); 
            }
        }
        multipliers.push(getMarketVolatilityPenalty(leg.mkt));

        let legPenalty = multipliers.reduce((a, b) => a * b, 1);
        totalPenalty *= Math.max(0.80, legPenalty); 
    });

    if (isSingleBet) {
        rawCombinedProb = legs[0].rawProb;
        dynamicCorrelationPenalty = 1.0;
        structuralRiskScore += 0;
    } else if (!usedPoissonJoint) {
        rawCombinedProb = legs.reduce((acc: number, leg: any) => acc * leg.rawProb, 1);
        
        const hasBTTS = legs.some((l: any) => l.mkt.includes('ambos') || l.mkt.includes('btts'));
        const hasOverGols = legs.some((l: any) => (l.mkt.includes('mais') || l.mkt.includes('over')) && (l.mkt.includes('gol') || l.mkt.includes('gols')));
        const teamMentions: Record<string, number> = {};
        let hasTeamMarket = false; let hasMatchMarket = false;

        legs.forEach((leg: any) => {
            const parts = (leg.match || '').split(/\s*(vs|x|-)\s*/i);
            const home = parts.length >= 3 ? parts[0].trim().toLowerCase() : '';
            const away = parts.length >= 3 ? parts[2].trim().toLowerCase() : '';
            if (home && leg.mkt.includes(home)) { teamMentions[home] = (teamMentions[home] || 0) + 1; hasTeamMarket = true; }
            else if (away && leg.mkt.includes(away)) { teamMentions[away] = (teamMentions[away] || 0) + 1; hasTeamMarket = true; }
            else { hasMatchMarket = true; }
        });

        if (hasBTTS && hasOverGols) { dynamicCorrelationPenalty = 0.88; structuralRiskScore += 3; } 
        else if (hasTeamMarket && hasMatchMarket && hasOverGols) { dynamicCorrelationPenalty = 0.90; structuralRiskScore += 2; } 
        else if (Object.values(teamMentions).some(count => count >= 2)) { dynamicCorrelationPenalty = 0.92; structuralRiskScore += 2; } 
        else { dynamicCorrelationPenalty = 0.96; }

        const rawPureMath = legs.reduce((acc: number, curr: any) => acc * ((Number(curr.prob) || 75) / 100), 1);
        if (rawPureMath > 0.75) implicitCorrelationFlag = true;
    }

    const avgSample = legs.reduce((acc: number, curr: any) => acc + curr.sampleSize, 0) / legs.length;
    const confidenceAdjustment = avgSample >= 15 ? 1 : avgSample >= 10 ? 0.98 : avgSample >= 7 ? 0.95 : 0.92;

    const SHRINK_FACTOR = isSingleBet ? 0.98 : 0.96; 
    const structuralPenalty = structuralRiskScore >= 4 ? 0.90 : structuralRiskScore === 3 ? 0.93 : structuralRiskScore === 2 ? 0.95 : structuralRiskScore === 1 ? 0.97 : 1;

    // ==========================================
    // 🎯 PASSO 4: CALCULAR MARGEM DE ERRO E ESPECTRO
    // ==========================================
    let finalProb = rawCombinedProb * totalPenalty * SHRINK_FACTOR * confidenceAdjustment * dynamicCorrelationPenalty * structuralPenalty;

    json.combinedProb = Math.round(finalProb * 100);
    json.fairOdd = Number((1 / finalProb).toFixed(2));
    
    const zScore = 1.28; 
    let marginOfError = zScore * Math.sqrt((finalProb * (1 - finalProb)) / Math.max(avgSample, 5));
    marginOfError = Math.min(Math.max(marginOfError, 0.03), 0.08); 

    json.minProb = Math.max(1, Math.round((finalProb - marginOfError) * 100));
    json.maxProb = Math.min(99, Math.round((finalProb + marginOfError) * 100));

    let riskLabel = "BAIXO";
    if (json.fairOdd === Infinity || finalProb === 0) riskLabel = "ALTO";
    else if (structuralRiskScore >= 3 || avgSample < 10 || finalProb < 0.40) riskLabel = "ALTO";
    else if (structuralRiskScore >= 1 || avgSample < 15 || implicitCorrelationFlag) riskLabel = "MÉDIO"; 
    
    json.structuralRiskScore = structuralRiskScore;
    json.riskLevel = riskLabel;

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar múltipla.' });
  }
}