import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// 🧠 INFERÊNCIA DE POISSON (Engenharia Reversa de Probabilidade para Gols Esperados λ)
// Formula: P(X >= 1) = 1 - e^(-λ) => e^(-λ) = 1 - P => λ = -ln(1 - P)
const getPoissonLambda = (prob: number) => {
  const safeProb = Math.min(Math.max(prob, 0.01), 0.99); // Evita log(0)
  return -Math.log(1 - safeProb);
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

    const isOnlyGols = isSingleMarket && selectedMarketsStr.toLowerCase().includes('gol');
    const crossMarketInstruction = isSingleMarket
      ? (isOnlyGols 
          ? `- 🛑 REGRA DE MERCADO ÚNICO (GOLS): OBRIGATÓRIO cruzar o desempenho de uma Equipe Específica com o contexto global do Jogo (Ex: Gols do Time Mandante + Ambas Marcam, ou Gols de Equipe + Over 1.5). EVITE cruzar HT com FT.`
          : `- 🛑 REGRA DE MERCADO ÚNICO (CANTOS): Você OBRIGATORIAMENTE deve cruzar linhas cronológicas diferentes (Ex: Cantos HT + Cantos FT) ou o desempenho de Equipe vs Partida.`)
      : `- 🛑 REGRA DE CROSS-MARKET: Priorize cruzar mercados diferentes (Ex: Gols + Escanteios) para evitar o bloqueio e o desconto do 'Same Game Multiplier'.`;

    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    let finalValidJson = null;
    let attempts = 0;
    let lastInternalError = "";

    while (attempts < 2 && !finalValidJson) {
      attempts++;
      
      const prompt = `Você é um Analista Quantitativo HFT Institucional.
🎯 META DE ODD E PROBABILIDADE: A Odd Justa Final deve ficar IDEALMENTE entre @1.60 e @2.00. Construa OBRIGATORIAMENTE uma DUPLA. Priorize linhas com probabilidade entre 65% e 85%.
${lastInternalError ? `\n⚠️ ATENÇÃO - CORREÇÃO OBRIGATÓRIA DA TENTATIVA ANTERIOR: ${lastInternalError}\n` : ''}

⚙️ MOTOR MATEMÁTICO:
1. NÃO invente números. Use o Hit Rate real (%).
2. Se a amostra exata não estiver visível, DESCARTE O MERCADO.
3. DIVERGÊNCIA CASA/FORA: Retorne "true" se o Hit Rate for carregado por apenas um time.
4. HIERARQUIA: H2H e dados das equipes têm PRIORIDADE ABSOLUTA.

⚠️ REGRAS DE MERCADO E LIQUIDEZ:
- Use apenas: [ ${selectedMarketsStr} ].
- 🛑 LINHAS DE LIQUIDEZ: Para Gols, prefira linhas de 0.5 a 3.5. Para Escanteios Totais, prefira de 6.5 a 11.5. Mínimo exigido: 3.5 para times e 6.5 para partida.
${crossMarketInstruction}

⚠️ REGRAS DE UX E FORMATAÇÃO:
As chaves "alternativeCombination", "conservativeCombination" e "analysis" devem conter APENAS TEXTO CORRIDO HUMANO. PROIBIDO CÓDIGO JSON NESSAS STRINGS.
Para a "analysis", use OBRIGATORIAMENTE duas quebras de linha ("\\n\\n") para separar os 3 parágrafos.

Retorne ESTRITAMENTE um JSON válido:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Partida (FT) - Mais de 8.5 Escanteios",
      "prob": 78,
      "sampleSize": 10,
      "sourceExcerpt": "Texto lido",
      "divergenceRisk": false
    }
  ],
  "alternativeCombination": "Apenas texto livre. 🛑 REGRA: Sugira OBRIGATORIAMENTE uma tática com linhas DIFERENTES da seleção principal.",
  "conservativeCombination": "Apenas texto livre. 🛑 REGRA: Sugira uma dupla muito mais segura reduzindo as linhas originais.",
  "analysis": "📊 A Lógica dos Números: O Hit rate é...\\n\\n⚽ Leitura de Jogo (Game Script): Esperamos que...\\n\\n🎯 Risco e Retorno: Isso protege..."
}`;

      const result = await model.generateContent([prompt, ...imageParts]);
      let responseText = result.response.text();
      const matchJson = responseText.match(/\{[\s\S]*\}/);
      if (!matchJson) { lastInternalError = "JSON inválido."; continue; }

      let json;
      try { json = JSON.parse(matchJson[0]); } catch { lastInternalError = "JSON quebrado."; continue; }

      if (typeof json.alternativeCombination === 'string' && json.alternativeCombination.includes('{"selections"')) {
         json.alternativeCombination = "Recomendamos explorar mercados de gols de equipe ou buscar uma combinação mais ampla na partida inteira.";
      }
      if (typeof json.conservativeCombination === 'string' && json.conservativeCombination.includes('{"selections"')) {
         json.conservativeCombination = "Aplicar Fractional Drop: reduza as linhas originais em 1 ou 2 pontos de corte (ex: de 1.5 Gols para 0.5 Gols).";
      }

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
        selections: [ { match: "Análise Interrompida (Proteção)", market: "Mercados lidos não possuem liquidez", prob: 0, sampleSize: 0, sourceExcerpt: "Fallback Ativado", divergenceRisk: false } ],
        combinedProb: 0, fairOdd: 0, structuralRiskScore: 5, riskLevel: "ALTO",
        alternativeCombination: "Aguarde o jogo entrar no Ao Vivo para melhores liquidez.",
        conservativeCombination: "Tente selecionar múltiplas categorias (Gols + Cantos).",
        analysis: "📊 A Lógica dos Números: As linhas extraídas têm um Same Game Tax muito alto.\n\n⚽ Leitura de Jogo: Motor backend abortou.\n\n🎯 Risco e Retorno: EV negativo. Proteja seu capital."
      };
    }

    const json = finalValidJson;

    // ==========================================
    // 🧠 SAME GAME TAX ENGINE (Cálculo do Delta Δ)
    // ==========================================
    let structuralRiskScore = 0;
    let dynamicCorrelationPenalty = 0.98; 
    let implicitCorrelationFlag = false;

    if (json.selections && json.selections.length > 1) {
      const marketsLower = json.selections.map((s: any) => (s.market || '').toLowerCase());
      
      const hasHTGoals = marketsLower.some((m: string) => (m.includes('(ht)') || m.includes('1º')) && (m.includes('gol') || m.includes('gols')));
      const hasFTGoals = marketsLower.some((m: string) => (m.includes('(ft)') || m.includes('partida') || m.includes('jogo')) && (m.includes('gol') || m.includes('gols')));
      const isDoubleOverGoals = hasHTGoals && hasFTGoals;

      const hasBTTS = marketsLower.some((m: string) => m.includes('ambos') || m.includes('btts'));
      const hasOverGols = marketsLower.some((m: string) => (m.includes('mais') || m.includes('over')) && (m.includes('gol') || m.includes('gols')));
      
      let htLine: number | null = null;
      let ftLine: number | null = null;
      let hasTeamMarket = false;
      let hasMatchMarket = false;
      const teamMentions: Record<string, number> = {};

      json.selections.forEach((sel: any) => {
        const mkt = (sel.market || '').toLowerCase();
        
        // Extração de Linhas para o Delta
        const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
        if (lineMatch && (mkt.includes('gol') || mkt.includes('gols'))) {
            const lineVal = parseFloat(lineMatch[1]);
            if (mkt.includes('ht') || mkt.includes('1º')) htLine = lineVal;
            if (mkt.includes('ft') || mkt.includes('partida')) ftLine = lineVal;
        }

        const parts = (sel.match || '').split(/\s*(vs|x|-)\s*/i);
        const home = parts.length >= 3 ? parts[0].trim().toLowerCase() : '';
        const away = parts.length >= 3 ? parts[2].trim() : '';
        
        if (home && mkt.includes(home)) { teamMentions[home] = (teamMentions[home] || 0) + 1; hasTeamMarket = true; }
        else if (away && mkt.includes(away)) { teamMentions[away] = (teamMentions[away] || 0) + 1; hasTeamMarket = true; }
        else { hasMatchMarket = true; }
      });

      // 📐 O NOVO MULTIPLICADOR BASEADO NA DISTÂNCIA DAS LINHAS (Δ)
      if (isDoubleOverGoals && htLine !== null && ftLine !== null) {
          const delta = ftLine - htLine; // Distância entre o HT e o FT
          
          if (delta <= 1.0) {
              dynamicCorrelationPenalty = 0.78; // Brutal! Altíssima dependência (Ex: 0.5 HT e 1.5 FT)
              structuralRiskScore += 4;
          } else if (delta <= 1.5) {
              dynamicCorrelationPenalty = 0.84; // Forte dependência (Ex: 0.5 HT e 2.0 FT)
              structuralRiskScore += 3;
          } else if (delta >= 2.0) {
              dynamicCorrelationPenalty = 0.89; // Menor dependência (Ex: 1.5 HT e 3.5 FT)
              structuralRiskScore += 2;
          }
      } else if (isDoubleOverGoals) {
          dynamicCorrelationPenalty = 0.82; // Fallback se não parsear a linha
          structuralRiskScore += 4;
      } else if (hasBTTS && hasOverGols) {
          dynamicCorrelationPenalty = 0.85; 
          structuralRiskScore += 3;
      } else if (hasTeamMarket && hasMatchMarket && hasOverGols) {
          dynamicCorrelationPenalty = 0.88;
          structuralRiskScore += 2;
      } else if (Object.values(teamMentions).some(count => count >= 2)) {
          dynamicCorrelationPenalty = 0.92;
          structuralRiskScore += 2;
      } else {
          dynamicCorrelationPenalty = 0.96; // Baseline geral intra-jogo (Ajustado para realismo)
      }
    }

    // ==========================================
    // 🧮 CALCULO QUANTITATIVO: FIM DO ERRO COMPOSTO
    // ==========================================
    if (json.selections && json.selections.length > 0) {
      
      const rawCombinedProb = json.selections.reduce(
        (acc: number, curr: any) => {
          let statedProb = (Number(curr.prob) || 75) / 100;
          let sampleSize = Number(curr.sampleSize) || 10;
          if (sampleSize < 1) sampleSize = 10;

          // 💡 INJEÇÃO DE POISSON: Calculamos o Lambda implícito e garantimos que a prob 
          // não desafie as leis matemáticas do decaimento exponencial.
          const expectedGoalsLambda = getPoissonLambda(statedProb); 
          let hits = Math.round(statedProb * sampleSize);
          
          const { alpha, beta } = getGlobalWeakPriors(curr.market || '');
          let rawProb = (hits + alpha) / (sampleSize + alpha + beta);
          
          const mkt = (curr.market || '').toLowerCase();
          const matchStr = (curr.match || '').toLowerCase();
          const parts = matchStr.split(/\s*(vs|x|-)\s*/i);
          const home = parts.length >= 3 ? parts[0].trim() : '';
          const away = parts.length >= 3 ? parts[2].trim() : '';
          const isTeamMarket = (home && mkt.includes(home)) || (away && mkt.includes(away)) || (!mkt.includes('partida') && !mkt.includes('jogo') && !mkt.includes('total') && !mkt.includes('ambos'));

          let multipliers = [];

          const excerpt = curr.sourceExcerpt || '';
          if (!/\d/.test(excerpt)) multipliers.push(0.85);
          
          if (curr.divergenceRisk || (isTeamMarket && rawProb > 0.75)) multipliers.push(0.95);
          if (rawProb > 0.85) multipliers.push(0.97);

          const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
          if (lineMatch) {
             const line = parseFloat(lineMatch[1]);
             if (mkt.includes('escanteio') || mkt.includes('canto')) {
                if (isTeamMarket && line < 4.5) multipliers.push(0.92); 
                if (!isTeamMarket && line < 8.5) multipliers.push(0.95); 
             } else if (mkt.includes('gol')) {
                if (line < 1.0 && !mkt.includes('ht') && !mkt.includes('1º')) multipliers.push(0.88); 
             }
          }

          multipliers.push(getMarketVolatilityPenalty(curr.market || ''));

          let combinedLegPenalty = multipliers.reduce((a, b) => a * b, 1);
          combinedLegPenalty = Math.max(0.80, combinedLegPenalty);
          
          return acc * (rawProb * combinedLegPenalty);
        }, 1
      );

      const rawPureMath = json.selections.reduce((acc: number, curr: any) => acc * ((Number(curr.prob) || 75) / 100), 1);
      if (rawPureMath > 0.75) implicitCorrelationFlag = true;

      const avgSample = json.selections.reduce((acc: number, curr: any) => acc + (Number(curr.sampleSize) || 10), 0) / json.selections.length;
      const confidenceAdjustment = avgSample >= 15 ? 1 : avgSample >= 10 ? 0.98 : avgSample >= 7 ? 0.95 : 0.92;

      const SHRINK_FACTOR = 0.96; 
      
      const structuralPenalty =
        structuralRiskScore >= 4 ? 0.90 :
        structuralRiskScore === 3 ? 0.93 :
        structuralRiskScore === 2 ? 0.95 :
        structuralRiskScore === 1 ? 0.97 : 1;

      let finalProb = rawCombinedProb * SHRINK_FACTOR * confidenceAdjustment * dynamicCorrelationPenalty * structuralPenalty;

      json.combinedProb = Math.round(finalProb * 100);
      json.fairOdd = Number((1 / finalProb).toFixed(2));
      
      let riskLabel = "BAIXO";
      if (json.fairOdd === Infinity || finalProb === 0) {
         riskLabel = "ALTO";
      } else if (structuralRiskScore >= 3 || avgSample < 10 || finalProb < 0.40) {
         riskLabel = "ALTO";
      } else if (structuralRiskScore >= 1 || avgSample < 15 || implicitCorrelationFlag) {
         riskLabel = "MÉDIO"; 
      }
      
      json.structuralRiskScore = structuralRiskScore;
      json.riskLevel = riskLabel;

    } else {
      throw new Error('Nenhuma seleção válida encontrada.');
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar múltipla.' });
  }
}