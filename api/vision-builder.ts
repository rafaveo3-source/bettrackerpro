import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// ==========================================
// 🧠 MOTOR ATUARIAL: POISSON E MÍNIMOS QUADRADOS
// ==========================================
const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);

const poissonPDF = (lambda: number, k: number) => (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);

const poissonCDF = (lambda: number, k: number) => {
    let sum = 0;
    for (let i = 0; i <= k; i++) sum += poissonPDF(lambda, i);
    return sum;
};

// Fallback para quando o LLM não consegue extrair múltiplas linhas (Single Point Inversion)
const findLambdaForProb = (targetProb: number, k: number): number => {
    let low = 0.01; let high = 10.0; 
    const safeTarget = Math.min(Math.max(targetProb, 0.01), 0.99); 
    for (let iter = 0; iter < 20; iter++) {
        let mid = (low + high) / 2;
        let currentProb = 1 - poissonCDF(mid, k); 
        if (currentProb < safeTarget) low = mid; 
        else high = mid;
    }
    return (low + high) / 2;
};

// 🎯 STATE-OF-THE-ART: Market-Implied Poisson Calibration (Least Squares Fitting)
const estimateLambdaFromMarket = (lines: {line: number, prob: number}[]) => {
    if (!lines || lines.length === 0) return null;
    
    let bestLambda = 2.0;
    let bestError = Infinity;

    for (let lambda = 0.1; lambda <= 6.0; lambda += 0.01) {
        let error = 0;
        for (let l of lines) {
            // Ex: Para Over 2.5, k = floor(2.5) = 2. P(X > 2) = 1 - CDF(2)
            const k = Math.floor(l.line); 
            const modelProb = 1 - poissonCDF(lambda, k);
            const targetProb = l.prob / 100; // Converte 70% para 0.70
            
            // Ponderação: Linhas menores têm mais liquidez e menor ruído, logo ganham mais peso no fitting
            const weight = 1 / (l.line + 1); 
            
            error += weight * Math.pow(modelProb - targetProb, 2);
        }

        if (error < bestError) {
            bestError = error;
            bestLambda = lambda;
        }
    }
    return bestLambda;
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
  let alpha = 2.0; let beta = 2.0;
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
      generationConfig: { temperature: 0.15 }, 
    });

    const isSingleMarket = markets && markets.length === 1;
    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    const crossMarketInstruction = isSingleMarket
      ? `- 🛑 REGRA DE MERCADO ÚNICO: Varie as linhas para mitigar o desconto da casa (Ex: Cruce equipe vs partida, ou HT vs FT).`
      : `- 🛑 REGRA DE CROSS-MARKET: Priorize cruzar mercados diferentes (Ex: Gols + Escanteios) para evitar o bloqueio e o desconto do 'Same Game Multiplier'.`;

    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    let finalValidJson = null;
    let attempts = 0;
    let lastInternalError = "";

    while (attempts < 2 && !finalValidJson) {
      attempts++;
      
      const prompt = `Você é um Analista Quantitativo HFT Institucional.
🎯 META DE ODD E PROBABILIDADE: A Odd Justa Final deve ficar IDEALMENTE entre @1.60 e @2.00. 
${lastInternalError ? `\n⚠️ ATENÇÃO - CORREÇÃO OBRIGATÓRIA DA TENTATIVA ANTERIOR: ${lastInternalError}\n` : ''}

⚙️ MOTOR MATEMÁTICO E LEITURA VISUAL:
1. 🛑 ANTI-CHERRY-PICKING E FALSIFICAÇÃO: É ESTRITAMENTE PROIBIDO misturar dados de tabelas diferentes. A probabilidade (chave "prob") DEVE ser EXATAMENTE o número na mesma linha da Odd. NUNCA arredonde.
2. 🔍 EXTRAÇÃO DE AMOSTRA: Identifique ativamente o tamanho da amostra (Ex: "últimos 10 jogos"). Informe esse número exato na chave "sampleSize".
3. 📉 VARREDURA DE CURVA DE GOLS (NOVO E CRÍTICO): Para que nosso motor calcule o Mínimo Quadrático (Least Squares), você DEVE extrair TODAS as linhas de "Mais de X Gols" (Over FT) e suas respectivas probabilidades (Hit Rates) que estiverem visíveis na imagem. Insira no array "goalMarketLines". Se não achar, deixe vazio.
4. 🔎 CAÇADOR DE ODDS (SINGLE BET): 
   - A ODD DEVE ESTAR VISÍVEL NUMERICAMENTE na imagem.
   - Se encontrar UMA ÚNICA linha com Hit Rate aceitável (>= 60%) E a ODD VISÍVEL for entre @1.60 e @2.00, CONSTRUA APOSTA SIMPLES.
   - Caso contrário, CONSTRUA UMA DUPLA.
5. 🛡️ EVIDÊNCIA VISUAL: Em "sourceExcerpt", transcreva a string EXATA que comprova a probabilidade lida.

⚠️ REGRAS DE MERCADO E LIQUIDEZ:
- Use apenas: [ ${selectedMarketsStr} ].
${crossMarketInstruction}

⚠️ REGRAS DE UX E FORMATAÇÃO:
- 🛑 REGRA ANTI-SINÔNIMOS: A "alternativeCombination" NÃO PODE ser um sinônimo matemático da principal.

Retorne ESTRITAMENTE um JSON válido neste formato:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Partida - Mais de 8.5 Escanteios",
      "prob": 67,
      "sampleSize": 10,
      "sourceExcerpt": "67% em 10 jogos visível na tabela.",
      "extractedOdd": 1.72,
      "divergenceRisk": false
    }
  ],
  "goalMarketLines": [
    {"line": 0.5, "prob": 90},
    {"line": 1.5, "prob": 70},
    {"line": 2.5, "prob": 45}
  ],
  "alternativeCombination": "Texto livre...",
  "conservativeCombination": "Texto livre...",
  "analysis": "📊 A Lógica dos Números: ...\\n\\n⚽ Leitura de Jogo: ...\\n\\n🎯 Risco e Retorno: ..."
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
          if (mkt.includes('escanteio') || mkt.includes('canto')) {
            const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
            if (lineMatch) {
              const line = parseFloat(lineMatch[1]);
              const isTeamMarket = mkt.includes('casa') || mkt.includes('visitante') || (!mkt.includes('partida') && !mkt.includes('jogo'));
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
        selections: [ { match: "Análise Interrompida", market: "Mercados inválidos", prob: 0, sampleSize: 0, sourceExcerpt: "Fallback", divergenceRisk: false } ],
        combinedProb: 0, fairOdd: 0, structuralRiskScore: 5, riskLevel: "ALTO", minProb: 0, maxProb: 0,
        alternativeCombination: "Aguarde o jogo entrar no Ao Vivo.", conservativeCombination: "Reveja critérios.",
        analysis: "📊 A Lógica dos Números: Dados sem evidência.\n\n⚽ Leitura de Jogo: Motor abortou.\n\n🎯 Risco e Retorno: Risco crítico."
      };
    }

    const json = finalValidJson;

    // ==========================================
    // 🧮 PASSO 1: POSTERIOR BAYESIANA CONTÍNUA & TRIBUNAL DETERMINÍSTICO
    // ==========================================
    let extractedSampleSizes: number[] = [];

    let legs = json.selections.map((sel: any) => {
        let statedProb = (Number(sel.prob) || 50) / 100;
        let sampleSize = Number(sel.sampleSize);
        const excerpt = sel.sourceExcerpt || '';

        const hasValidEvidence = /\b\d{1,3}%\b/.test(excerpt) || /\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(excerpt);
        if (!hasValidEvidence) statedProb = statedProb * 0.70; 

        let realSample = (sampleSize && sampleSize > 0) ? sampleSize : 3; 
        extractedSampleSizes.push(realSample);

        const { alpha, beta } = getGlobalWeakPriors(sel.market || '');
        const priorMean = alpha / (alpha + beta);
        const priorWeight = alpha + beta;
        
        let rawProb = (statedProb * realSample + priorMean * priorWeight) / (realSample + priorWeight);
        
        const mkt = (sel.market || '').toLowerCase();
        let line = null;
        const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
        if (lineMatch) line = parseFloat(lineMatch[1]);

        return { ...sel, rawProb, line, mkt, realSample, hasValidEvidence };
    });

    let rawCombinedProb = 1;
    let structuralRiskScore = 0;
    let dynamicCorrelationPenalty = 1.0; 
    let usedPoissonJoint = false;

    const isSingleBet = legs.length === 1;

    // ==========================================
    // 🧠 PASSO 2: MARKET-IMPLIED POISSON (Least Squares)
    // ==========================================
    if (!isSingleBet) {
        const isPureGoalsMkt = legs.every((l:any) => !l.mkt.includes('ambos') && !l.mkt.includes('btts') && !l.mkt.includes('escanteio') && !l.mkt.includes('canto'));
        const hasHTGoals = legs.some((l: any) => (l.mkt.includes('(ht)') || l.mkt.includes('1º')) && l.mkt.includes('gol'));
        const hasFTGoals = legs.some((l: any) => (l.mkt.includes('(ft)') || l.mkt.includes('partida') || l.mkt.includes('jogo')) && l.mkt.includes('gol'));
        const isDoubleOverGoals = isPureGoalsMkt && hasHTGoals && hasFTGoals && legs.length === 2;

        if (isDoubleOverGoals) {
            const htLeg = legs.find((l: any) => l.mkt.includes('(ht)') || l.mkt.includes('1º'));
            const ftLeg = legs.find((l: any) => l.mkt.includes('(ft)') || l.mkt.includes('partida') || l.mkt.includes('jogo'));

            if (htLeg && ftLeg && htLeg.line !== null && ftLeg.line !== null) {
                const targetHT = Math.floor(htLeg.line); 
                const targetFT = Math.floor(ftLeg.line); 

                // 🔥 A MÁGICA: Tenta calibrar o Lambda usando todas as linhas (Market-Implied). Se não vierem do LLM, usa o fallback pontual.
                const robustLambdaFT = estimateLambdaFromMarket(json.goalMarketLines);
                
                const lambda_HT = findLambdaForProb(htLeg.rawProb, targetHT); // HT continua pontual (alta previsibilidade em intervalos curtos)
                const lambda_FT = robustLambdaFT !== null ? robustLambdaFT : findLambdaForProb(ftLeg.rawProb, targetFT);
                
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
    // 🛡️ PASSO 3: PENALIDADES HEURÍSTICAS ABERTAS
    // ==========================================
    let totalPenalty = 1;
    let implicitCorrelationFlag = false;

    legs.forEach((leg: any) => {
        let multipliers = [];
        if (!leg.hasValidEvidence) multipliers.push(0.90); 
        if (leg.rawProb > 0.85) multipliers.push(0.97);
        multipliers.push(getMarketVolatilityPenalty(leg.mkt));
        totalPenalty *= multipliers.reduce((a, b) => a * b, 1); 
    });

    if (isSingleBet) {
        rawCombinedProb = legs[0].rawProb;
        dynamicCorrelationPenalty = 1.0;
        structuralRiskScore += 0;
    } else if (!usedPoissonJoint) {
        rawCombinedProb = legs.reduce((acc: number, leg: any) => acc * leg.rawProb, 1);
        
        const hasBTTS = legs.some((l: any) => l.mkt.includes('ambos') || l.mkt.includes('btts'));
        const hasOverGols = legs.some((l: any) => (l.mkt.includes('mais') || l.mkt.includes('over')) && l.mkt.includes('gol'));
        
        if (hasBTTS && hasOverGols) { dynamicCorrelationPenalty = 0.85; structuralRiskScore += 4; } 
        else { dynamicCorrelationPenalty = 0.96; }

        const rawPureMath = legs.reduce((acc: number, curr: any) => acc * ((Number(curr.prob) || 75) / 100), 1);
        if (rawPureMath > 0.75) implicitCorrelationFlag = true;
    }

    const avgSample = extractedSampleSizes.reduce((a, b) => a + b, 0) / extractedSampleSizes.length;
    const confidenceAdjustment = avgSample >= 15 ? 1 : avgSample >= 10 ? 0.98 : avgSample >= 7 ? 0.95 : 0.90;

    const SHRINK_FACTOR = isSingleBet ? 0.98 : 0.96; 
    const structuralPenalty = structuralRiskScore >= 4 ? 0.90 : structuralRiskScore === 3 ? 0.93 : structuralRiskScore === 2 ? 0.95 : 1;

    // ==========================================
    // 🎯 PASSO 4: CALCULAR MARGEM DE ERRO REALISTA
    // ==========================================
    let finalProb = rawCombinedProb * totalPenalty * SHRINK_FACTOR * confidenceAdjustment * dynamicCorrelationPenalty * structuralPenalty;

    json.combinedProb = Math.round(finalProb * 100);
    json.fairOdd = Number((1 / finalProb).toFixed(2));
    
    const zScore = 1.28; 
    let marginOfError = zScore * Math.sqrt((finalProb * (1 - finalProb)) / avgSample);
    marginOfError = Math.min(Math.max(marginOfError, 0.02), 0.15); 

    json.minProb = Math.max(1, Math.round((finalProb - marginOfError) * 100));
    json.maxProb = Math.min(99, Math.round((finalProb + marginOfError) * 100));

    let riskLabel = "BAIXO";
    if (json.fairOdd === Infinity || finalProb === 0) riskLabel = "ALTO";
    else if (structuralRiskScore >= 3 || avgSample < 7 || finalProb < 0.40) riskLabel = "ALTO";
    else if (structuralRiskScore >= 1 || avgSample < 10 || implicitCorrelationFlag) riskLabel = "MÉDIO"; 
    
    json.structuralRiskScore = structuralRiskScore;
    json.riskLevel = riskLabel;

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar múltipla.' });
  }
}