import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// ==========================================
// 🧠 1. MOTOR DE TEORIA DA INFORMAÇÃO (SHANNON ENTROPY)
// ==========================================
const shannonEntropy = (p: number) => {
    if (p <= 0 || p >= 1) return 0;
    return -p * Math.log(p) - (1 - p) * Math.log(1 - p);
};

const entropyWeight = (p: number) => {
    const maxEntropy = 0.693147; 
    const weight = 1 - (shannonEntropy(p) / maxEntropy);
    return Math.max(0.05, Math.min(weight, 1));
};

// ==========================================
// 🧠 2. MOTOR ATUARIAL E CACHE (OTIMIZADO PARA SERVERLESS)
// ==========================================
const factorialTable = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000];

const factorial = (n: number) => {
    if (n < factorialTable.length) return factorialTable[n];
    let result = factorialTable[factorialTable.length - 1];
    for (let i = factorialTable.length; i <= n; i++) result *= i;
    return result;
};

const poissonCache: Record<string, number> = {};

const poissonPDF = (lambda: number, k: number) => {
    const key = `${lambda}_${k}`;
    if (poissonCache[key] !== undefined) return poissonCache[key];
    const p = (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
    poissonCache[key] = p;
    return p;
};

const poissonCDF = (lambda: number, k: number) => {
    let sum = 0;
    for (let i = 0; i <= k; i++) sum += poissonPDF(lambda, i);
    return sum;
};

const dixonColesAdjustment = (x: number, y: number, lambdaH: number, lambdaA: number, rho: number = -0.10) => {
  if (x === 0 && y === 0) return 1 - (lambdaH * lambdaA * rho);
  if (x === 0 && y === 1) return 1 + (lambdaH * rho);
  if (x === 1 && y === 0) return 1 + (lambdaA * rho);
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
};

const findLambdaForProb = (targetProb: number, k: number): number => {
    let low = 0.1; let high = 5.0; 
    const safeTarget = Math.min(Math.max(targetProb, 0.05), 0.95); 
    for (let iter = 0; iter < 15; iter++) {
        let mid = (low + high) / 2;
        let currentProb = 1 - poissonCDF(mid, k); 
        if (currentProb < safeTarget) low = mid; 
        else high = mid;
    }
    return (low + high) / 2;
};

// ==========================================
// 🎯 3. PRICING ENGINES (STATELESS CALIBRATION)
// ==========================================
const getTrueProbabilitiesFrom1X2 = (oddH: number, oddD: number, oddA: number) => {
    if (!oddH || !oddD || !oddA) return null;
    const pH = 1 / oddH; const pD = 1 / oddD; const pA = 1 / oddA;
    const sum = pH + pD + pA;
    return { pH: pH / sum, pD: pD / sum, pA: pA / sum };
};

const estimateLambdasFrom1X2 = (pH: number, pD: number, pA: number) => {
    let best = { error: Infinity, lh: 1.3, la: 1.1 };
    for (let lh = 0.3; lh <= 3.5; lh += 0.1) {
        for (let la = 0.3; la <= 3.5; la += 0.1) {
            let ph_model = 0, pd_model = 0, pa_model = 0, total = 0;
            for (let i = 0; i <= 8; i++) {
                for (let j = 0; j <= 8; j++) {
                    const base = poissonPDF(lh, i) * poissonPDF(la, j);
                    const tau = dixonColesAdjustment(i, j, lh, la);
                    const p = base * tau;
                    total += p;
                    if (i > j) ph_model += p;
                    else if (i === j) pd_model += p;
                    else pa_model += p;
                }
            }
            ph_model /= total; pd_model /= total; pa_model /= total;
            const error = Math.pow(ph_model - pH, 2) + Math.pow(pd_model - pD, 2) + Math.pow(pa_model - pA, 2);
            if (error < best.error) best = { error, lh, la };
        }
    }
    return { lh: best.lh, la: best.la, total: best.lh + best.la };
};

const estimateLambdaFromMarket = (lines: {line: number, prob: number}[]) => {
    if (!lines || lines.length < 2) return null; 
    let bestLambda = 2.0; let bestError = Infinity;
    for (let lambda = 0.3; lambda <= 4.5; lambda += 0.05) {
        let error = 0;
        for (let l of lines) {
            const k = Math.floor(l.line); 
            const targetProb = l.prob > 1 ? l.prob / 100 : l.prob;
            const safeProb = Math.min(Math.max(targetProb, 0.05), 0.95);
            const weight = Math.min(1 / (safeProb * (1 - safeProb)), 10); 
            const modelProb = 1 - poissonCDF(lambda, k);
            error += weight * Math.pow(modelProb - targetProb, 2);
        }
        if (error < bestError) { bestError = error; bestLambda = lambda; }
    }
    return bestLambda;
};

// 🐛 BUG CORRIGIDO: Removido multiplicador 1.25 do Least Squares, pois os dados da imagem já contêm o overdispersion real do mercado.
const estimateCornerLambdaFromMarket = (lines: {line: number, prob: number}[]) => {
    if (!lines || lines.length < 2) return null; 
    let bestLambda = 9.0; let bestError = Infinity;
    for (let lambda = 5.0; lambda <= 15.0; lambda += 0.1) {
        let error = 0;
        for (let l of lines) {
            const k = Math.floor(l.line);
            const targetProb = l.prob > 1 ? l.prob / 100 : l.prob;
            const safeProb = Math.min(Math.max(targetProb, 0.05), 0.95);
            const weight = Math.min(1 / (safeProb * (1 - safeProb)), 10);
            const modelProb = 1 - poissonCDF(lambda, k); 
            error += weight * Math.pow(modelProb - targetProb, 2);
        }
        if (error < bestError) { bestError = error; bestLambda = lambda; }
    }
    return bestLambda;
};

const calculateBTTSProbability = (lh: number, la: number) => {
    let p = 0; let total = 0;
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const base = poissonPDF(lh, i) * poissonPDF(la, j);
            const tau = dixonColesAdjustment(i, j, lh, la);
            const prob = base * tau;
            total += prob;
            if (i >= 1 && j >= 1) p += prob;
        }
    }
    return p / total;
};

const calculateExactBTTSAndOver = (lh: number, la: number, overLine: number) => {
    let p = 0; let total = 0;
    for (let i = 0; i <= 8; i++) {
        for (let j = 0; j <= 8; j++) {
            const base = poissonPDF(lh, i) * poissonPDF(la, j);
            const tau = dixonColesAdjustment(i, j, lh, la);
            const prob = base * tau;
            total += prob;
            if (i >= 1 && j >= 1 && (i + j) > overLine) p += prob;
        }
    }
    return p / total;
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

const getGlobalWeakPriors = (market: string) => {
  const mkt = market.toLowerCase();
  let alpha = 2.0; let beta = 2.0;
  if (mkt.includes('gol') || mkt.includes('gols')) {
      if (mkt.includes('1.5') && !mkt.includes('ht') && !mkt.includes('1º')) { alpha = 2.9; beta = 1.1; } 
      else if (mkt.includes('0.5') && (mkt.includes('ht') || mkt.includes('1º'))) { alpha = 2.6; beta = 1.4; } 
      else { alpha = 2.4; beta = 1.6; }
  } else if (mkt.includes('ambos') || mkt.includes('btts')) { alpha = 2.2; beta = 1.8; } 
  else if (mkt.includes('escanteio') || mkt.includes('canto')) { alpha = 2.2; beta = 1.8; }
  return { alpha, beta };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { images, email, markets } = req.body; 
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.10 }, 
    });

    const isSingleMarket = markets && markets.length === 1;
    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    let finalValidJson = null; let attempts = 0; let lastInternalError = "";

    // ==========================================
    // 👁️ CAMADA 1: LLM DATA SCRAPER (Dumb Extractor)
    // ==========================================
    while (attempts < 2 && !finalValidJson) {
      attempts++;
      
      const prompt = `Você é um Extrator de Dados HFT. O Motor Quantitativo de Backend tomará as decisões. Sua ÚNICA função é extrair estatísticas das imagens de forma estruturada.
${lastInternalError ? `\n⚠️ CORREÇÃO OBRIGATÓRIA: ${lastInternalError}\n` : ''}

⚙️ LEITURA DE DADOS (CRÍTICO):
1. 🛑 ANTI-CONTAMINAÇÃO: Agrupe os dados perfeitamente por jogo no array "matches". NUNCA misture estatísticas de um jogo no objeto do outro.
2. 📉 VARREDURA POR JOGO:
   - Extraia "matchOdds1x2" (home, draw, away). Se não houver, retorne null.
   - Extraia TODAS as linhas de Gols FT e Escanteios FT visíveis para "goalMarketLines" e "cornerMarketLines".
3. 🔎 EXTRAÇÃO DE OPORTUNIDADES ("viablePicks"): 
   - Liste TODAS as opções de apostas que tenham Hit Rate >= 60% e ODD visível. Não decida a aposta final, apenas liste as opções lidas.
   - 🛡️ EVIDÊNCIA: Em "sourceExcerpt", transcreva a prova exata (OBRIGATÓRIO conter símbolo % ou fração).

⚠️ REGRAS: Apenas [ ${selectedMarketsStr} ]. Mínimo Gols (0.5), Escanteios (6.5).

Retorne ESTRITAMENTE um JSON válido neste formato:
{
  "matches": [
    {
      "matchName": "Time A v Time B",
      "matchOdds1x2": { "home": 1.80, "draw": 3.60, "away": 4.20 },
      "goalMarketLines": [ {"line": 1.5, "prob": 70} ],
      "cornerMarketLines": [ {"line": 8.5, "prob": 65} ],
      "viablePicks": [
        { "market": "Partida - Mais de 8.5 Escanteios", "prob": 67, "sampleSize": 10, "sourceExcerpt": "67% em 10 jogos", "extractedOdd": 1.72 }
      ]
    }
  ],
  "alternativeCombination": "Sugestão tática...",
  "conservativeCombination": "Sugestão conservadora...",
  "analysis": "📊..."
}`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const matchJson = result.response.text().match(/\{[\s\S]*\}/);
      if (!matchJson) { lastInternalError = "JSON inválido."; continue; }
      try { finalValidJson = JSON.parse(matchJson[0]); } catch { lastInternalError = "JSON quebrado."; continue; }
    }

    if (!finalValidJson || !finalValidJson.matches) throw new Error("Abortado: Dados sem evidência válida.");
    const json = finalValidJson;

    // ==========================================
    // 🧮 CAMADA 2: MOTOR QUANTITATIVO E PORTFOLIO OPTIMIZER
    // ==========================================
    let extractedSampleSizes: number[] = [];

    for (let match of json.matches) {
        let lh = 1.3, la = 1.1, lt = 2.4, lc = null;
        let activeGoals = false;
        
        let trueProbs = match.matchOdds1x2 ? getTrueProbabilitiesFrom1X2(match.matchOdds1x2.home, match.matchOdds1x2.draw, match.matchOdds1x2.away) : null;
        let lsLambdaTotal = estimateLambdaFromMarket(match.goalMarketLines);

        if (trueProbs && lsLambdaTotal) {
            const est = estimateLambdasFrom1X2(trueProbs.pH, trueProbs.pD, trueProbs.pA);
            lh = est.lh; la = est.la; lt = (0.6 * est.total) + (0.4 * lsLambdaTotal);
            activeGoals = true;
        } else if (trueProbs) {
            const est = estimateLambdasFrom1X2(trueProbs.pH, trueProbs.pD, trueProbs.pA);
            lh = est.lh; la = est.la; lt = est.total;
            activeGoals = true;
        } else if (lsLambdaTotal) {
            lt = lsLambdaTotal; lh = lsLambdaTotal * 0.55; la = lsLambdaTotal * 0.45;
            activeGoals = true;
        }
        lc = estimateCornerLambdaFromMarket(match.cornerMarketLines);
        match.engine = { lh, la, lt, lc, activeGoals };

        if (!match.viablePicks) match.viablePicks = [];

        // Avaliação Estatística e ENTROPY SCORING
        for (let pick of match.viablePicks) {
            pick.match = match.matchName;
            let statedProb = (Number(pick.prob) || 50) / 100;
            let sampleSize = Number(pick.sampleSize);
            const excerpt = pick.sourceExcerpt || '';

            const hasValidEvidence = /\b\d{1,3}%\b/.test(excerpt) || /\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(excerpt);
            if (!hasValidEvidence) statedProb *= 0.70; 

            let realSample = (sampleSize && sampleSize > 0) ? sampleSize : 3; 
            extractedSampleSizes.push(realSample);

            const { alpha, beta } = getGlobalWeakPriors(pick.market || '');
            let rawProb = (statedProb * realSample + (alpha / (alpha + beta)) * (alpha + beta)) / (realSample + alpha + beta);
            
            const mkt = (pick.market || '').toLowerCase();
            let line = null; const lineMatch = mkt.match(/(?:mais|menos|over|under|acima|abaixo)[^\d]*(\d+(\.\d+)?)/i);
            if (lineMatch) line = parseFloat(lineMatch[1]);
            const isTeamMarket = mkt.includes('casa') || mkt.includes('visitante') || (!mkt.includes('partida') && !mkt.includes('jogo'));
            const isUnder = mkt.includes('menos') || mkt.includes('under') || mkt.includes('abaixo');

            if (activeGoals && mkt.includes('gol')) {
                if (mkt.includes('ambos') || mkt.includes('btts')) {
                    rawProb = calculateBTTSProbability(lh, la);
                } else if (line !== null) {
                    const k = Math.floor(line);
                    if (mkt.includes('1º') || mkt.includes('ht') || mkt.includes('primeiro')) {
                        rawProb = 1 - poissonCDF(lt * 0.45, k);
                    } else if (!isTeamMarket) {
                        rawProb = isUnder ? poissonCDF(lt, k) : 1 - poissonCDF(lt, k);
                    }
                }
            }
            
            // 🐛 BUG CORRIGIDO: Removido multiplicador 1.25 do cálculo da probabilidade de cantos.
            if (lc && (mkt.includes('escanteio') || mkt.includes('canto')) && !isTeamMarket && line !== null) {
                const k = Math.floor(line);
                rawProb = isUnder ? poissonCDF(lc, k) : 1 - poissonCDF(lc, k);
            }

            pick.rawProb = rawProb;
            pick.line = line;
            pick.mkt = mkt;
            pick.isTeamMarket = isTeamMarket;
            pick.hasValidEvidence = hasValidEvidence;
            pick.realSample = realSample;
            pick.volatilityPenalty = getMarketVolatilityPenalty(mkt);
            
            // 🎯 O ALGORITMO SHANNON & KELLY (Pick Evaluation)
            // Calculamos a prob final provisória (com punição de OCR) APENAS para gerar o Score
            pick.finalLegProb = rawProb * pick.volatilityPenalty * (hasValidEvidence ? 1 : 0.90) * (rawProb > 0.85 ? 0.97 : 1);
            
            const rawOdd = pick.extractedOdd || 1;
            const odd = Math.min(Math.max(rawOdd, 1.01), 15);
            
            const ev = (pick.finalLegProb * odd) - 1;
            const weight = entropyWeight(pick.finalLegProb);
            const implied = 1 / odd;
            const edge = pick.finalLegProb - implied;

            pick.score = edge * weight * Math.log(odd); 
            pick.extractedOdd = odd;
        }

        match.viablePicks = match.viablePicks.filter((p:any)=>p.score > 0);
        match.viablePicks.sort((a:any, b:any) => b.score - a.score);
    }

    // ==========================================
    // 🧠 PASSO 5: PORTFOLIO OPTIMIZER (Seleção Combinatória)
    // ==========================================
    const validMatches = json.matches.filter((m:any) => m.viablePicks && m.viablePicks.length > 0);
    validMatches.sort((a:any, b:any) => b.viablePicks[0].score - a.viablePicks[0].score);

    let selectedLegs: any[] = [];
    let isSameGameMulti = false;

    if (validMatches.length >= 2) {
        let bestCombo = [validMatches[0].viablePicks[0], validMatches[1].viablePicks[0]];
        let bestScore = -Infinity;

        for (let i = 0; i < Math.min(2, validMatches[0].viablePicks.length); i++) {
            for (let j = 0; j < Math.min(2, validMatches[1].viablePicks.length); j++) {
                const p1 = validMatches[0].viablePicks[i];
                const p2 = validMatches[1].viablePicks[j];
                
                if (p1.score > -0.1 && p2.score > -0.1) {
                    const combProb = p1.finalLegProb * p2.finalLegProb;
                    const comboScore = (p1.score + p2.score) * combProb;
                    
                    if (comboScore > bestScore) {
                        bestScore = comboScore;
                        bestCombo = [p1, p2];
                    }
                }
            }
        }
        selectedLegs = bestCombo;
    } else if (validMatches.length === 1) {
        const bestPicks = validMatches[0].viablePicks;
        if (bestPicks.length >= 2 && bestPicks[0].extractedOdd < 1.60) {
            selectedLegs = [bestPicks[0], bestPicks[1]];
            isSameGameMulti = true;
        } else {
            selectedLegs = [bestPicks[0]];
        }
    }

    if (selectedLegs.length === 0) throw new Error("Motor não encontrou Valor Esperado (EV+) tolerável.");

    // ==========================================
    // 🧩 PASSO 6: RESOLUÇÃO ESTRUTURAL DA APOSTA
    // ==========================================
    let rawCombinedProb = 1; let structuralRiskScore = 0; let dynamicCorrelationPenalty = 1.0;
    const isSingleBet = selectedLegs.length === 1;

    // 🐛 BUG CORRIGIDO: Usamos a rawProb PURA para evitar "Double Penalty" nos cálculos do Passo 7
    if (isSingleBet) {
        rawCombinedProb = selectedLegs[0].rawProb;
    } else if (isSameGameMulti) {
        const eng = validMatches[0].engine;
        const hasGoals = selectedLegs.some((l:any) => l.mkt.includes('gol'));
        const hasCorners = selectedLegs.some((l:any) => l.mkt.includes('escanteio') || l.mkt.includes('canto'));
        const hasBTTS = selectedLegs.some((l:any) => l.mkt.includes('ambos') || l.mkt.includes('btts'));
        const hasTeamCorner = selectedLegs.some((l:any) => l.isTeamMarket && (l.mkt.includes('escanteio') || l.mkt.includes('canto')));
        const hasMatchCorner = selectedLegs.some((l:any) => !l.isTeamMarket && (l.mkt.includes('escanteio') || l.mkt.includes('canto')));
        const hasHTCorner = selectedLegs.some((l:any) => (l.mkt.includes('1º') || l.mkt.includes('ht') || l.mkt.includes('primeiro')) && (l.mkt.includes('escanteio') || l.mkt.includes('canto')));
        const overGoalLeg = selectedLegs.find((l:any) => !l.mkt.includes('ambos') && !l.mkt.includes('btts') && (l.mkt.includes('mais') || l.mkt.includes('over') || l.mkt.includes('acima')) && l.line !== null);

        if (hasBTTS && overGoalLeg && eng.activeGoals) {
            rawCombinedProb = calculateExactBTTSAndOver(eng.lh, eng.la, Math.floor(overGoalLeg.line));
            structuralRiskScore += 1;
        } else {
            const isPureGoalsMkt = selectedLegs.every((l:any) => !l.mkt.includes('escanteio') && !l.mkt.includes('canto'));
            const htLeg = selectedLegs.find((l: any) => (l.mkt.includes('(ht)') || l.mkt.includes('1º') || l.mkt.includes('primeiro')) && (l.mkt.includes('gol') || l.mkt.includes('gols')));
            const ftLeg = selectedLegs.find((l: any) => (l.mkt.includes('gol') || l.mkt.includes('gols')) && !l.mkt.includes('(ht)') && !l.mkt.includes('1º') && !l.mkt.includes('primeiro'));
            
            if (isPureGoalsMkt && htLeg && ftLeg && htLeg.line !== null && ftLeg.line !== null) {
                const targetHT = Math.floor(htLeg.line); const targetFT = Math.floor(ftLeg.line); 
                const lambda_FT = eng.activeGoals ? eng.lt : findLambdaForProb(ftLeg.rawProb, targetFT);
                const lambda_HT = eng.activeGoals ? eng.lt * 0.45 : findLambdaForProb(htLeg.rawProb, targetHT);
                const lambda_2T = Math.max(0.1, lambda_FT - lambda_HT);

                let pureJoint = 0;
                for (let i = targetHT + 1; i <= 8; i++) { 
                    const pHT = poissonPDF(lambda_HT, i);
                    const p2T = 1 - poissonCDF(lambda_2T, Math.max(0, (targetFT + 1) - i) - 1);
                    pureJoint += (pHT * p2T);
                }
                rawCombinedProb = pureJoint;
                structuralRiskScore += 3; 
            } else {
                rawCombinedProb = selectedLegs.reduce((acc: number, leg: any) => acc * leg.rawProb, 1);
            }
        }

        let corrMultipliers = [];
        if (hasTeamCorner && hasMatchCorner) corrMultipliers.push(0.88);
        if (hasHTCorner && hasMatchCorner) corrMultipliers.push(0.84);
        if (hasGoals && hasCorners) corrMultipliers.push(0.95);
        if (hasBTTS && !overGoalLeg && hasGoals) corrMultipliers.push(0.90);
        dynamicCorrelationPenalty = corrMultipliers.reduce((a, b) => a * b, 1);
    } else {
        // Multiplicação Pura usando rawProb para evitar double penalty
        rawCombinedProb = selectedLegs.reduce((acc: number, leg: any) => acc * leg.rawProb, 1);
    }

    // ==========================================
    // 🎯 PASSO 7: APRESENTAÇÃO E UI
    // ==========================================
    // Aplicação global e limpa das penalidades
    let evidencePenalty = selectedLegs.reduce((acc: number, leg: any) => acc * (leg.hasValidEvidence ? 1 : 0.90), 1);
    let highProbSqueeze = selectedLegs.reduce((acc: number, leg: any) => acc * (leg.rawProb > 0.85 ? 0.97 : 1), 1);
    let legVolatilityPenalty = selectedLegs.reduce((acc: number, leg: any) => acc * leg.volatilityPenalty, 1);

    const avgSample = extractedSampleSizes.length > 0 ? (extractedSampleSizes.reduce((a, b) => a + b, 0) / extractedSampleSizes.length) : 3;
    const confidenceAdjustment = avgSample >= 15 ? 1 : avgSample >= 10 ? 0.98 : avgSample >= 7 ? 0.95 : 0.90;
    const SHRINK_FACTOR = isSingleBet ? 0.98 : 0.96; 
    const structuralPenalty = structuralRiskScore >= 3 ? 0.90 : structuralRiskScore === 2 ? 0.95 : 1;

    let finalProb = rawCombinedProb * legVolatilityPenalty * evidencePenalty * highProbSqueeze * SHRINK_FACTOR * confidenceAdjustment * dynamicCorrelationPenalty * structuralPenalty;

    finalProb = Math.max(0.01, Math.min(finalProb, 0.98));

    json.selections = selectedLegs.map(l => ({
        match: l.match,
        market: l.market,
        prob: l.prob,
        sampleSize: l.sampleSize,
        sourceExcerpt: l.sourceExcerpt,
        extractedOdd: l.extractedOdd
    }));

    json.combinedProb = Math.round(finalProb * 100);
    json.fairOdd = Number((1 / finalProb).toFixed(2));
    
    let marginOfError = 1.28 * Math.sqrt((finalProb * (1 - finalProb)) / avgSample);
    marginOfError = Math.min(Math.max(marginOfError, 0.02), 0.15); 

    json.minProb = Math.max(1, Math.round((finalProb - marginOfError) * 100));
    json.maxProb = Math.min(99, Math.round((finalProb + marginOfError) * 100));

    let riskLabel = "BAIXO";
    if (json.fairOdd === Infinity || finalProb === 0) riskLabel = "ALTO";
    else if (avgSample < 7 || finalProb < 0.40) riskLabel = "ALTO";
    else if (avgSample < 10 || dynamicCorrelationPenalty < 0.9) riskLabel = "MÉDIO"; 
    
    json.structuralRiskScore = structuralRiskScore;
    json.riskLevel = riskLabel;

    // =====================================================
    // 🧠 GERAÇÃO DETERMINÍSTICA DE TEXTO PARA O FRONTEND
    // =====================================================
    if (!json.analysis) {
      if (riskLabel === "BAIXO") {
        json.analysis = "Modelo quantitativo identifica valor esperado positivo com baixa correlação estrutural entre eventos.";
      } else if (riskLabel === "MÉDIO") {
        json.analysis = "A aposta possui valor esperado positivo, porém com dependência moderada entre mercados.";
      } else {
        json.analysis = "O motor detectou alta variância estrutural nesta combinação. A probabilidade depende fortemente de eventos correlacionados.";
      }
    }

    if (!json.alternativeCombination) {
      try {
        const allPicks = validMatches.flatMap((m:any)=>m.viablePicks || []);
        const secondBest = allPicks.filter((p:any)=>!selectedLegs.includes(p)).sort((a:any,b:any)=>b.score-a.score)[0];

        if (secondBest) {
          json.alternativeCombination = `Alternativa com perfil semelhante de valor em ${secondBest.match}: ${secondBest.market} (${Math.round(secondBest.rawProb * 100)}% estimado, Odd @${secondBest.extractedOdd}).`;
        } else {
          json.alternativeCombination = "Nenhuma alternativa tática secundária clara foi identificada com valor esperado superior no contexto analisado.";
        }
      } catch {
        json.alternativeCombination = "Nenhuma alternativa tática clara foi identificada.";
      }
    }

    if (!json.conservativeCombination) {
      const safestLeg = [...selectedLegs].sort((a: any, b: any) => b.finalLegProb - a.finalLegProb)[0];
      if (safestLeg) {
        json.conservativeCombination = `Estratégia conservadora: considerar apenas "${safestLeg.market}" em ${safestLeg.match}, que isoladamente possui a maior base de probabilidade do bilhete (${Math.round(safestLeg.finalLegProb * 100)}%).`;
      } else {
        json.conservativeCombination = "Estratégia conservadora indisponível para este conjunto de dados.";
      }
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Engine:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar cotações.' });
  }
}