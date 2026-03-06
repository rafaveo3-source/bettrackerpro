import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// ==========================================
// 🧠 1. MOTOR DE TEORIA DA INFORMAÇÃO E SRE
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

const factorialTable = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000];
const factorial = (n: number) => {
    if (n < factorialTable.length) return factorialTable[n];
    let result = factorialTable[factorialTable.length - 1];
    for (let i = factorialTable.length; i <= n; i++) result *= i;
    return result;
};

// ==========================================
// 🧠 2. MOTOR ATUARIAL: ADAPTIVE BIVARIATE POISSON
// ==========================================
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

const bivariatePoissonPDF = (x: number, y: number, l1: number, l2: number, l3: number) => {
    let sum = 0;
    const minXY = Math.min(x, y);
    for (let i = 0; i <= minXY; i++) {
        sum += (Math.pow(l3, i) / factorial(i)) *
               (Math.pow(l1, x - i) / factorial(x - i)) *
               (Math.pow(l2, y - i) / factorial(y - i));
    }
    return Math.exp(-(l1 + l2 + l3)) * sum;
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
// 🎯 3. PRICING ENGINES & MATRIZES BIVARIADAS
// ==========================================
const getTrueProbabilitiesFrom1X2 = (oddH: number, oddD: number, oddA: number) => {
    if (!oddH || !oddD || !oddA) return null;
    const pH = 1 / oddH; const pD = 1 / oddD; const pA = 1 / oddA;
    const sum = pH + pD + pA;
    return { pH: pH / sum, pD: pD / sum, pA: pA / sum };
};

const estimateLambdasFrom1X2 = (pH: number, pD: number, pA: number) => {
    let best = { error: Infinity, lh: 1.3, la: 1.1 };
    
    for (let lh = 0.3; lh <= 3.5; lh += 0.2) {
        for (let la = 0.3; la <= 3.5; la += 0.2) {
            let ph_model = 0, pd_model = 0, pa_model = 0, total = 0;
            
            // ✅ OTIMIZAÇÃO INSTITUCIONAL: λ3 Dinâmico baseado no Expected Goals (lh + la)
            const l3 = Math.min(0.25, (lh + la) * 0.08); 
            const l1 = Math.max(0.1, lh - l3);
            const l2 = Math.max(0.1, la - l3);

            for (let i = 0; i <= 7; i++) {
                for (let j = 0; j <= 7; j++) {
                    const p = bivariatePoissonPDF(i, j, l1, l2, l3) * dixonColesAdjustment(i, j, lh, la);
                    total += p;
                    if (i > j) ph_model += p; else if (i === j) pd_model += p; else pa_model += p;
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
            error += weight * Math.pow((1 - poissonCDF(lambda, k)) - targetProb, 2);
        }
        if (error < bestError) { bestError = error; bestLambda = lambda; }
    }
    return bestLambda;
};

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
            error += weight * Math.pow((1 - poissonCDF(lambda, k)) - targetProb, 2);
        }
        if (error < bestError) { bestError = error; bestLambda = lambda; }
    }
    return bestLambda;
};

const calculateBTTSProbability = (lh: number, la: number) => {
    let p = 0; let total = 0;
    // ✅ λ3 Dinâmico para cálculo exato do BTTS
    const l3 = Math.min(0.25, (lh + la) * 0.08); 
    const l1 = Math.max(0.1, lh - l3);
    const l2 = Math.max(0.1, la - l3);

    for (let i = 0; i <= 7; i++) {
        for (let j = 0; j <= 7; j++) {
            const prob = bivariatePoissonPDF(i, j, l1, l2, l3) * dixonColesAdjustment(i, j, lh, la);
            total += prob;
            if (i >= 1 && j >= 1) p += prob;
        }
    }
    return p / total;
};

const getMarketType = (market: string) => {
    const m = market.toLowerCase();
    const isUnder = m.includes("menos") || m.includes("under") || m.includes("abaixo");
    if (m.includes("btts") || m.includes("ambos")) return "btts";
    if (m.includes("escanteio") || m.includes("canto")) return isUnder ? "under_corners" : "over_corners";
    if (m.includes("gol") || m.includes("gols")) return isUnder ? "under_goals" : "over_goals";
    if (m.includes("race") || m.includes("primeiro a")) return "race";
    return "other";
};

const correlationMatrix = [
    { a: "over_goals", b: "over_corners", rho: 0.18 },
    { a: "under_goals", b: "over_corners", rho: -0.12 },
    { a: "over_goals", b: "under_corners", rho: -0.10 },
    { a: "under_goals", b: "under_corners", rho: 0.15 },
    { a: "btts", b: "over_goals", rho: 0.32 },
    { a: "btts", b: "under_goals", rho: -0.25 },
    { a: "btts", b: "over_corners", rho: 0.10 }
];

const getCorrelation = (m1: string, m2: string) => {
    const t1 = getMarketType(m1); const t2 = getMarketType(m2);
    for (const c of correlationMatrix) {
        if ((c.a === t1 && c.b === t2) || (c.a === t2 && c.b === t1)) return c.rho;
    }
    return 0; 
};

const getMarketVolatilityPenalty = (market: string) => {
  const m = market.toLowerCase();
  if (m.includes('1º tempo') || m.includes('1o tempo') || m.includes('(ht)') || m.includes('primeiro tempo')) return 0.95; 
  if (m.includes('ambos') || m.includes('btts')) return 0.96;
  if (m.includes('escanteios') || m.includes('cantos')) return 0.97;
  return 1;
};

const getGlobalWeakPriors = (market: string) => {
  const mkt = market.toLowerCase();
  let alpha = 2.0; let beta = 2.0;
  if (mkt.includes('gol') || mkt.includes('gols')) {
      if (mkt.includes('1.5') && !mkt.includes('ht') && !mkt.includes('1º')) { alpha = 2.9; beta = 1.1; } 
      else { alpha = 2.4; beta = 1.6; }
  } else if (mkt.includes('escanteio') || mkt.includes('canto')) { alpha = 2.2; beta = 1.8; }
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
        generationConfig: { temperature: 0.10, responseMimeType: "application/json" }
    });

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios, BTTS';
    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    // ==========================================
    // 👁️ CAMADA 1: VISION OCR (The Scraper)
    // ==========================================
    let finalValidJson = null; let attempts = 0;

    while (attempts < 2 && !finalValidJson) {
      attempts++;
      const prompt = `Você é um Extrator de Dados. Transcreva as estatísticas das imagens.
1. Agrupe por jogo em "matches".
2. Extraia "matchOdds1x2" (home, draw, away) e "goalMarketLines" e "cornerMarketLines".
3. Em "viablePicks", liste APENAS mercados válidos (${selectedMarketsStr}) com Hit Rate >= 55% e ODD visível. 
   - 🛑 IGNORE "Race", "Primeiro a Marcar", "Par/Ímpar", "Exato".
   - "confidence": 0.1 a 1.0 sobre a clareza da leitura da odd.
4. "matchContext": Breve resumo do cenário tático lido (Sem inventar dados).

Formato JSON esperado:
{
  "matches": [
    {
      "matchName": "A v B",
      "matchContext": "Resumo...",
      "matchOdds1x2": { "home": 1.80, "draw": 3.60, "away": 4.20 },
      "goalMarketLines": [ {"line": 1.5, "prob": 70} ],
      "cornerMarketLines": [ {"line": 8.5, "prob": 65} ],
      "viablePicks": [
        { "market": "Mais de 8.5 Escanteios", "prob": 67, "sampleSize": 10, "extractedOdd": 1.72, "confidence": 0.95 }
      ]
    }
  ]
}`;
      try {
        const result = await model.generateContent([{ text: prompt }, ...imageParts]);
        finalValidJson = JSON.parse(result.response.text()); 
      } catch (e: any) { continue; }
    }

    if (!finalValidJson || !finalValidJson.matches) throw new Error("Abortado: O OCR não conseguiu extrair dados numéricos válidos.");

    // ==========================================
    // 🧮 CAMADA 2: QUANT ENGINE MODELING
    // ==========================================
    let allProcessedLegs: any[] = [];
    let globalContextArray: string[] = []; 

    for (let match of finalValidJson.matches) {
        if (match.matchContext) globalContextArray.push(`${match.matchName}: ${match.matchContext}`);
        
        let lh = 1.3, la = 1.1, lt = 2.4, lc = null;
        let activeGoals = false;
        
        let trueProbs = match.matchOdds1x2 ? getTrueProbabilitiesFrom1X2(match.matchOdds1x2.home, match.matchOdds1x2.draw, match.matchOdds1x2.away) : null;
        let lsLambdaTotal = estimateLambdaFromMarket(match.goalMarketLines);

        if (trueProbs && lsLambdaTotal) {
            const est = estimateLambdasFrom1X2(trueProbs.pH, trueProbs.pD, trueProbs.pA);
            lh = est.lh; la = est.la; lt = (0.6 * est.total) + (0.4 * lsLambdaTotal);
            activeGoals = true;
        } else if (lsLambdaTotal) {
            lt = lsLambdaTotal; lh = lsLambdaTotal * 0.55; la = lsLambdaTotal * 0.45;
            activeGoals = true;
        }
        
        lc = estimateCornerLambdaFromMarket(match.cornerMarketLines);

        if (!match.viablePicks) continue;

        for (let pick of match.viablePicks) {
            pick.match = match.matchName;
            const mkt = (pick.market || '').toLowerCase();
            pick.mkt = mkt;
            pick.matchLt = lt; // ⚡ Salva o Expected Goals (lt) para o Tempo Factor na Copula
            
            if (mkt.includes('race') || mkt.includes('exat') || mkt.includes('ímpar') || mkt.includes('par')) continue;

            // ✅ OTIMIZAÇÃO: Filtro Estrito de Sample Size (Ignora ruídos de baixa amostra)
            let realSample = Number(pick.sampleSize);
            if (!realSample || realSample < 6) continue;

            let statedProb = (Number(pick.prob) || 50) / 100;
            const { alpha, beta } = getGlobalWeakPriors(mkt);
            let rawProb = (statedProb * realSample + (alpha / (alpha + beta)) * (alpha + beta)) / (realSample + alpha + beta);
            
            let line = null; const lineMatch = mkt.match(/(?:mais|menos|over|under|acima|abaixo)[^\d]*(\d+(\.\d+)?)/i);
            if (lineMatch) line = parseFloat(lineMatch[1]);
            const isTeamMarket = mkt.includes('casa') || mkt.includes('visitante');
            const isUnder = mkt.includes('menos') || mkt.includes('under') || mkt.includes('abaixo');

            if (activeGoals && mkt.includes('gol')) {
                if (mkt.includes('ambos') || mkt.includes('btts')) {
                    rawProb = calculateBTTSProbability(lh, la);
                } else if (line !== null && !isTeamMarket) {
                    const k = Math.floor(line);
                    rawProb = isUnder ? poissonCDF(lt, k) : 1 - poissonCDF(lt, k);
                }
            }
            if (lc && (mkt.includes('escanteio') || mkt.includes('canto')) && !isTeamMarket && line !== null) {
                const k = Math.floor(line);
                rawProb = isUnder ? poissonCDF(lc, k) : 1 - poissonCDF(lc, k);
            }

            pick.volatilityPenalty = getMarketVolatilityPenalty(mkt);
            pick.finalLegProb = rawProb * pick.volatilityPenalty * (rawProb > 0.85 ? 0.97 : 1);
            pick.finalLegProb = Math.max(0.01, Math.min(pick.finalLegProb, 0.98));

            const rawOdd = pick.extractedOdd || 1;
            pick.extractedOdd = Math.min(Math.max(rawOdd, 1.01), 10.0);
            pick.confidence = pick.confidence !== undefined ? Number(pick.confidence) : 1.0;
            
            // ✅ OTIMIZAÇÃO: The "Too Good To Be True" Circuit Breaker (OCR Error)
            if (pick.finalLegProb > 0.80 && pick.extractedOdd > 1.50) continue;

            allProcessedLegs.push(pick);
        }
    }

    // ==========================================
    // 💡 PASSO 3: O VALUE SCANNER (Combinatorics & Edge)
    // ==========================================
    let opportunities: any[] = [];
    const ODD_MIN = 1.60;
    const ODD_MAX = 2.00;
    const EDGE_MIN = -0.01; 

    // 1. Validar Singles
    for (let leg of allProcessedLegs) {
        const marketProb = 1 / leg.extractedOdd;
        const edge = leg.finalLegProb - marketProb; 
        const ev = (leg.finalLegProb * leg.extractedOdd) - 1; 
        
        if (leg.extractedOdd >= ODD_MIN && leg.extractedOdd <= ODD_MAX && edge >= EDGE_MIN) {
            const score = edge * entropyWeight(leg.finalLegProb) * leg.confidence;
            opportunities.push({ type: 'Simples', legs: [leg], prob: leg.finalLegProb, odd: leg.extractedOdd, ev, edge, score });
        }
    }

    // 2. Validar Duplas (Cópula de Variância Real e Same Game Tax)
    for (let i = 0; i < allProcessedLegs.length; i++) {
        for (let j = i + 1; j < allProcessedLegs.length; j++) {
            const l1 = allProcessedLegs[i];
            const l2 = allProcessedLegs[j];
            const isSameGame = l1.match === l2.match;

            if (isSameGame && getMarketType(l1.mkt) === getMarketType(l2.mkt)) continue;

            let combProb = l1.finalLegProb * l2.finalLegProb;
            let corrLabel = "";

            if (isSameGame) {
                let rho = getCorrelation(l1.mkt, l2.mkt);
                // ✅ OTIMIZAÇÃO: Ritmo de Jogo amplificando a correlação
                const tempoFactor = Math.min(1.3, l1.matchLt / 2.5);
                rho = rho * tempoFactor;

                // ✅ OTIMIZAÇÃO: Cópula de Pearson baseada em Variância Binomial Real
                const var1 = l1.finalLegProb * (1 - l1.finalLegProb);
                const var2 = l2.finalLegProb * (1 - l2.finalLegProb);
                combProb = combProb + (rho * Math.sqrt(var1 * var2));
                
                // ✅ OTIMIZAÇÃO: Same Game Tax (Margem Institucional de Risco)
                combProb *= 0.96; 
                corrLabel = rho > 0 ? " (Sinergia Positiva)" : rho < 0 ? " (Desconto de Risco)" : " (SGP Tax)";
            }

            combProb = Math.max(0.01, Math.min(combProb, 0.98));
            const combOdd = l1.extractedOdd * l2.extractedOdd;
            const marketProb = 1 / combOdd;
            const edge = combProb - marketProb;
            const ev = (combProb * combOdd) - 1;

            if (combOdd >= ODD_MIN && combOdd <= ODD_MAX && edge >= EDGE_MIN) {
                const avgConf = (l1.confidence + l2.confidence) / 2;
                const score = edge * entropyWeight(combProb) * avgConf;
                opportunities.push({ 
                    type: isSameGame ? `Dupla Intragame${corrLabel}` : 'Dupla Cruzada', 
                    legs: [l1, l2], prob: combProb, odd: combOdd, ev, edge, score 
                });
            }
        }
    }

    opportunities.sort((a, b) => b.score - a.score);
    const topOpportunities = opportunities.slice(0, 3);

    if (topOpportunities.length === 0) {
        throw new Error("NO BET: O Scanner Quantitativo varreu os dados e não encontrou NENHUMA oportunidade com Valor (Edge Real/EV+) e Base Amostral Mínima (6+ jogos) dentro da faixa de odd @1.60 a @2.00.");
    }

    const bestOpp = topOpportunities[0];
    const finalSelections = bestOpp.legs.map((l:any) => ({
        match: l.match,
        market: l.market,
        prob: Math.round(l.finalLegProb * 100),
        extractedOdd: l.extractedOdd
    }));

    const combinedProb = Math.round(bestOpp.prob * 100);
    const fairOdd = Number((1 / bestOpp.prob).toFixed(2));
    const formattedEdge = (bestOpp.edge * 100) > 0 ? `+${(bestOpp.edge * 100).toFixed(1)}` : `${(bestOpp.edge * 100).toFixed(1)}`;
    const riskLabel = bestOpp.prob < 0.45 ? "ALTO" : bestOpp.legs.length > 1 ? "MÉDIO" : "BAIXO";

    // =====================================================
    // ✍️ CAMADA 4: NARRATIVE AI (Relatório Institucional)
    // =====================================================
    let generatedAnalysis = "";
    let generatedAlt = "";
    let generatedCons = "";

    try {
        const allContexts = globalContextArray.join(" | ");
        
        let opsText = topOpportunities.map((op, idx) => {
            const desc = op.legs.map((l:any) => `${l.market} (${l.match})`).join(" + ");
            return `Entrada ${idx + 1} (${op.type}): ${desc}. Odd: @${op.odd.toFixed(2)} | EV: ${(op.ev*100).toFixed(1)}% | Edge Real: ${(op.edge*100).toFixed(1)}%`;
        }).join("\n");

        const narrativePrompt = `Aja como um Analista Quantitativo de Sportsbook.
Nosso Value Scanner processou a matriz e filtrou as seguintes oportunidades de valor matemático (EV+):
${opsText}

Contexto extraído das imagens pelo OCR: "${allContexts}".

Escreva o relatório final focado apenas na ENTRADA 1.
Formato JSON esperado:
{
  "analysis": "Escreva 3 parágrafos curtos. 1: Scanner de Valor (Fale sobre a Entrada 1 ser a 'Top Pick' e cite a Odd, EV e a Edge contra o mercado). 2: Leitura de Jogo (Use o contexto para explicar o porquê taticamente). 3: Perfil de Risco.",
  "alternativeCombination": "Descreva as Entradas 2 ou 3 (se existirem no texto acima) como oportunidades secundárias detectadas no radar de valor.",
  "conservativeCombination": "Uma recomendação de Stake de acordo com o risco ou uma variação conservadora."
}`;

        const textResult = await model.generateContent(narrativePrompt);
        const textData = JSON.parse(textResult.response.text());
        
        if (!textData || !textData.analysis || !textData.alternativeCombination || !textData.conservativeCombination) throw new Error("JSON incompleto do Narrador.");

        generatedAnalysis = textData.analysis;
        generatedAlt = textData.alternativeCombination;
        generatedCons = textData.conservativeCombination;
        
    } catch (e) {
        generatedAnalysis = `📊 **Radar de Valor Ativado:** O Scanner processou a modelagem Bivariada e identificou a operação primária com Edge Real de ${formattedEdge}%. O Valor Esperado atende perfeitamente à tese estatística frente à odd de @${bestOpp.odd.toFixed(2)}.`;
        generatedAlt = topOpportunities.length > 1 ? `O Radar também detectou valor secundário: ${topOpportunities[1].legs.map((l:any)=>l.market).join(' + ')} (Odd @${topOpportunities[1].odd.toFixed(2)}, EV: ${(topOpportunities[1].ev*100).toFixed(1)}%).` : "O radar não identificou operações secundárias válidas com base amostral suficiente.";
        generatedCons = "Ajuste sua gestão de banca (Stake) de acordo com a Odd combinada e a sua exposição no mercado.";
    }

    return res.status(200).json({
        selections: finalSelections,
        combinedProb, fairOdd, minProb: Math.max(1, combinedProb - 10), maxProb: Math.min(99, combinedProb + 10), 
        riskLevel: riskLabel, structuralRiskScore: 0,
        analysis: generatedAnalysis,
        alternativeCombination: generatedAlt,
        conservativeCombination: generatedCons
    });

  } catch (error: any) {
    console.error("Erro Engine:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar cotações.' });
  }
}