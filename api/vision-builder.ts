import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Limite Serverless Vercel

// ==========================================
// 🧠 1. MOTOR DE TEORIA DA INFORMAÇÃO 
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

const poissonCDF = (lambda: number, k: number) => {
    let sum = 0;
    for (let i = 0; i <= k; i++) sum += (Math.pow(lambda, i) * Math.exp(-lambda)) / factorial(i);
    return sum;
};

// ==========================================
// 🎲 2. DISTRIBUIÇÕES ESTOCÁSTICAS 
// ==========================================
const randomNormal = () => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const randomGamma = (shape: number, scale: number) => {
    let d, c, x, v, u;
    let actualShape = shape;
    if (shape < 1) actualShape = shape + 1;
    
    d = actualShape - 1 / 3;
    c = 1 / Math.sqrt(9 * d);
    
    while (true) {
        x = randomNormal();
        v = 1 + c * x;
        while (v <= 0) { x = randomNormal(); v = 1 + c * x; }
        v = v * v * v;
        u = Math.random();
        let x2 = x * x;
        if (u < 1 - 0.0331 * x2 * x2 || Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
            let result = d * v;
            if (shape < 1) result *= Math.pow(Math.random(), 1 / shape);
            return result * scale;
        }
    }
};

const poissonSample = (lambda: number) => {
    if (lambda > 15) {
        const val = Math.round(lambda + Math.sqrt(lambda) * randomNormal());
        return Math.max(0, val);
    }
    const L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
};

const negativeBinomialSample = (mean: number, dispersion: number) => {
    const scale = mean / dispersion;
    const lambda = randomGamma(dispersion, scale);
    return poissonSample(lambda);
};

// ==========================================
// 🛠️ 3. NORMALIZAÇÃO HFT (Hash Deduplication)
// ==========================================
const normalizeMarket = (marketStr: string) => {
    const m = marketStr.toLowerCase();
    let type = 'other';
    let line = 0;
    let isOver = false;

    if (m.includes('race') || m.includes('exato') || m.includes('ímpar') || m.includes('par') || m.includes('primeiro a')) return null;

    const lineMatch = m.match(/(?:mais|menos|over|under|acima|abaixo)[^\d]*(\d+(\.\d+)?)/i);
    if (lineMatch) line = parseFloat(lineMatch[1]);

    isOver = m.includes('mais') || m.includes('over') || m.includes('acima');
    const isHT = m.includes('ht') || m.includes('1º tempo') || m.includes('1o tempo') || m.includes('primeiro');

    if (m.includes('gol') || m.includes('gols')) type = 'goals';
    else if (m.includes('escanteio') || m.includes('canto')) type = 'corners';
    else if (m.includes('btts') || m.includes('ambos')) type = 'btts';

    if (type === 'other') return null;

    const condition = type === 'btts' ? 'yes' : isOver ? 'over' : 'under';
    const hash = `${type}_${condition}_${line}_${isHT ? 'ht' : 'ft'}`;

    return { type, line, isOver, isHT, hash };
};

// ==========================================
// 🎯 4. PRICING & BLENDED PRIORS 
// ==========================================
const getTrueProbabilitiesFrom1X2 = (oddH: number, oddD: number, oddA: number) => {
    if (!oddH || !oddD || !oddA) return null;
    const pH = 1 / oddH; const pD = 1 / oddD; const pA = 1 / oddA;
    const sum = pH + pD + pA;
    return { pH: pH / sum, pD: pD / sum, pA: pA / sum };
};

const estimateLambdaFromMarket = (lines: {line: number, prob: number}[]) => {
    if (!lines || lines.length < 2) return null; 
    let bestLambda = 2.5; let bestError = Infinity;
    for (let lambda = 0.5; lambda <= 4.5; lambda += 0.05) {
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
    let bestLambda = 9.5; let bestError = Infinity;
    for (let lambda = 6.0; lambda <= 15.0; lambda += 0.1) {
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
      const prompt = `Você é um Extrator de Dados de Sportsbook.
1. Agrupe por jogo em "matches".
2. Extraia "matchOdds1x2" (home, draw, away) e "goalMarketLines" e "cornerMarketLines".
3. Em "viablePicks", liste mercados (${selectedMarketsStr}) com ODD visível. 
   - 🛑 IGNORE "Race", "Exato", "Par/Ímpar", "Primeiro a Marcar".
   - "prob": Extraia a probabilidade histórica mostrada no site.
   - "sampleSize": Tamanho da amostra visível (ex: 10).
   - "extractedOdd": Odd da casa de apostas (decimal).
   - "confidence": 0.1 a 1.0 (clareza da imagem).
4. "matchContext": Resumo tático do jogo.

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

    if (!finalValidJson || !finalValidJson.matches) throw new Error("Abortado: O OCR não extraiu matriz de dados válida.");

    // ==========================================
    // ⚙️ CAMADA 2: ON-THE-FLY MONTE CARLO ENGINE
    // ==========================================
    let allProcessedLegs: any[] = [];
    let globalContextArray: string[] = []; 

    for (let match of finalValidJson.matches) {
        if (match.matchContext) globalContextArray.push(`${match.matchName}: ${match.matchContext}`);
        if (!match.viablePicks || match.viablePicks.length === 0) continue;
        
        let market_lt = 2.6; 
        let market_lc = 10.0; 
        
        const trueProbs = match.matchOdds1x2 ? getTrueProbabilitiesFrom1X2(match.matchOdds1x2.home, match.matchOdds1x2.draw, match.matchOdds1x2.away) : null;
        const lsLambdaTotal = estimateLambdaFromMarket(match.goalMarketLines);
        const lsCorners = estimateCornerLambdaFromMarket(match.cornerMarketLines);

        if (lsLambdaTotal) market_lt = (0.75 * lsLambdaTotal) + (0.25 * 2.6); 
        if (lsCorners) market_lc = (0.75 * lsCorners) + (0.25 * 10.0);

        let lh = market_lt * 0.55; 
        let la = market_lt * 0.45;
        if (trueProbs) {
            lh = market_lt * trueProbs.pH;
            la = market_lt * trueProbs.pA;
        }

        const l3 = Math.min(0.25, market_lt * 0.07);
        const l1 = Math.max(0.1, lh - l3);
        const l2 = Math.max(0.1, la - l3);

        const activeMarketsMap = new Map();
        for (let pick of match.viablePicks) {
            const norm = normalizeMarket(pick.market || '');
            if (!norm) continue; 
            if (!activeMarketsMap.has(norm.hash)) {
                activeMarketsMap.set(norm.hash, { norm, hits: 0, ref: pick });
            }
        }
        
        const activeMarkets = Array.from(activeMarketsMap.values());
        const ITERATIONS = 25000;

        // 🎲 O MULTIVERSO OTIMIZADO (O(1) Memory Footprint)
        for (let i = 0; i < ITERATIONS; i++) {
            // --- FULL TIME (90 Min) ---
            const z = poissonSample(l3);
            const goalsHome = poissonSample(l1) + z;
            const goalsAway = poissonSample(l2) + z;
            const totalGoals = goalsHome + goalsAway;

            const pressure = totalGoals;
            const adjustedCornerMean = market_lc * (1 + pressure * 0.04);
            const dispersion = 2.0 + (Math.sqrt(pressure) * 0.8); 
            let corners = negativeBinomialSample(adjustedCornerMean, dispersion);
            corners = Math.min(corners, 22);

            // --- HALF TIME (45 Min) ---
            const z_ht = poissonSample(l3 * 0.45);
            const goalsHomeHT = poissonSample(l1 * 0.45) + z_ht;
            const goalsAwayHT = poissonSample(l2 * 0.45) + z_ht;
            const totalGoalsHT = goalsHomeHT + goalsAwayHT;
            
            const pressureHT = totalGoalsHT;
            const adjustedCornerMeanHT = (market_lc * 0.45) * (1 + pressureHT * 0.04);
            const dispersionHT = 2.0 + (Math.sqrt(pressureHT) * 0.8);
            let cornersHT = negativeBinomialSample(adjustedCornerMeanHT, dispersionHT);
            cornersHT = Math.min(cornersHT, 12);

            // Avaliação
            for (let j = 0; j < activeMarkets.length; j++) {
                const mkt = activeMarkets[j];
                const norm = mkt.norm;
                let isHit = false;

                const simGoals = norm.isHT ? totalGoalsHT : totalGoals;
                const simCorners = norm.isHT ? cornersHT : corners;

                if (norm.type === 'goals') {
                    isHit = norm.isOver ? (simGoals > norm.line) : (simGoals < norm.line);
                } else if (norm.type === 'corners') {
                    isHit = norm.isOver ? (simCorners > norm.line) : (simCorners < norm.line);
                } else if (norm.type === 'btts') {
                    if (norm.isHT) isHit = (goalsHomeHT > 0 && goalsAwayHT > 0);
                    else isHit = (goalsHome > 0 && goalsAway > 0);
                }
                
                if (isHit) mkt.hits++;
            }
        }

        // Pós-processamento dos Counters
        for (let mkt of activeMarkets) {
            const pick = mkt.ref;
            let realSample = Number(pick.sampleSize);
            if (!realSample || realSample < 6) continue;

            let rawProb = mkt.hits / ITERATIONS;
            rawProb = Math.max(0.01, Math.min(rawProb * (rawProb > 0.85 ? 0.96 : 1), 0.98));

            const rawOdd = pick.extractedOdd || 1;
            const finalOdd = Math.min(Math.max(rawOdd, 1.01), 10.0);
            const fairOdd = 1 / rawProb;

            // 🛡️ A BANDA DE REALIDADE (O Assassino de Fantasmas do OCR)
            // Se a probabilidade for alta (> 65%), o mercado não comete erros grotescos.
            // Reduzimos a tolerância de erro do OCR para no máximo 18% de descolamento.
            const maxOddTolerance = rawProb > 0.65 ? 1.18 : 1.35;
            
            if (finalOdd > fairOdd * maxOddTolerance) continue; 
            
            // ✅ FIX: Limite baixado para 1.25 para permitir construção de Bet Builders fortes
            if (finalOdd < 1.25) continue; 

            allProcessedLegs.push({
                match: match.matchName,
                market: pick.market,
                normHash: mkt.norm.hash,
                rawProb: rawProb,
                extractedOdd: finalOdd,
                confidence: pick.confidence !== undefined ? Number(pick.confidence) : 1.0,
                samplePenalty: Math.min(1, Math.sqrt(realSample / 12)) 
            });
        }
    }

    // ==========================================
    // 💡 PASSO 4: OPPORTUNITY FINDER 
    // ==========================================
    let opportunities: any[] = [];
    const ODD_MIN = 1.60;
    const ODD_MAX = 2.00;
    const EDGE_MIN = 0.03; 

    for (let leg of allProcessedLegs) {
        const marketProb = 1 / leg.extractedOdd;
        const edge = leg.rawProb - marketProb; 
        const ev = (leg.rawProb * leg.extractedOdd) - 1; 
        
        if (leg.extractedOdd >= ODD_MIN && leg.extractedOdd <= ODD_MAX && edge >= EDGE_MIN) {
            const score = edge * entropyWeight(leg.rawProb) * leg.confidence * leg.samplePenalty;
            opportunities.push({ type: 'Simples', legs: [leg], prob: leg.rawProb, odd: leg.extractedOdd, ev, edge, score });
        }
    }

    for (let i = 0; i < allProcessedLegs.length; i++) {
        for (let j = i + 1; j < allProcessedLegs.length; j++) {
            const l1 = allProcessedLegs[i];
            const l2 = allProcessedLegs[j];
            const isSameGame = l1.match === l2.match;

            if (isSameGame && l1.normHash.split('_')[0] === l2.normHash.split('_')[0]) continue;

            let combProb = l1.rawProb * l2.rawProb;
            if (isSameGame) combProb *= 0.95; 
            
            combProb = Math.max(0.01, Math.min(combProb, 0.98));
            const combOdd = l1.extractedOdd * l2.extractedOdd;
            const marketProb = 1 / combOdd;
            const edge = combProb - marketProb;
            const ev = (combProb * combOdd) - 1;

            if (combOdd >= ODD_MIN && combOdd <= ODD_MAX && edge >= EDGE_MIN) {
                const avgConf = (l1.confidence + l2.confidence) / 2;
                const avgSamplePen = (l1.samplePenalty + l2.samplePenalty) / 2;
                const score = edge * entropyWeight(combProb) * avgConf * avgSamplePen;
                opportunities.push({ 
                    type: isSameGame ? 'Dupla Intragame (Bet Builder)' : 'Dupla Cruzada (Parlay)', 
                    legs: [l1, l2], prob: combProb, odd: combOdd, ev, edge, score 
                });
            }
        }
    }

    const uniqueOps = new Map();
    for (let op of opportunities) {
        const opKey = op.legs.map((l:any) => l.normHash).sort().join("|");
        if (!uniqueOps.has(opKey) || uniqueOps.get(opKey).score < op.score) {
            uniqueOps.set(opKey, op);
        }
    }
    opportunities = Array.from(uniqueOps.values());
    opportunities.sort((a, b) => b.score - a.score);
    
    const topOpportunities = opportunities.slice(0, 3);

    if (topOpportunities.length === 0) {
        throw new Error("NO BET: O Scanner Monte Carlo rodou 25.000 iterações matemáticas e não encontrou NENHUMA Edge sólida (+3%) dentro do range de Odd @1.60 a @2.00.");
    }

    const bestOpp = topOpportunities[0];
    const finalSelections = bestOpp.legs.map((l:any) => ({
        match: l.match,
        market: l.market,
        prob: Math.round(l.rawProb * 100),
        extractedOdd: l.extractedOdd
    }));

    const combinedProb = Math.round(bestOpp.prob * 100);
    const fairOdd = Number((1 / bestOpp.prob).toFixed(2));
    const marketOdd = Number(bestOpp.odd.toFixed(2));
    const formattedEdge = (bestOpp.edge * 100) > 0 ? `+${(bestOpp.edge * 100).toFixed(1)}` : `${(bestOpp.edge * 100).toFixed(1)}`;
    const riskLabel = bestOpp.prob < 0.45 ? "ALTO" : bestOpp.legs.length > 1 ? "MÉDIO" : "BAIXO";

    // =====================================================
    // ✍️ CAMADA 5: NARRATIVE AI 
    // =====================================================
    let generatedAnalysis = "";
    let generatedAlt = "";
    let generatedCons = "";

    try {
        const allContexts = globalContextArray.join(" | ");
        const topPickDesc = bestOpp.legs.map((l:any) => `${l.market} (${l.match})`).join(" + ");
        
        let altPickDesc = "Nenhuma alternativa com EV forte detectada no range.";
        let consPickDesc = "Nenhuma variação secundária detectada.";

        if (topOpportunities.length > 1) {
            altPickDesc = `OPORTUNIDADE 2 (${topOpportunities[1].type}): ${topOpportunities[1].legs.map((l:any) => `${l.market} (${l.match})`).join(" + ")} (Odd: @${topOpportunities[1].odd.toFixed(2)} | EV: ${(topOpportunities[1].ev*100).toFixed(1)}%)`;
        }
        if (topOpportunities.length > 2) {
            consPickDesc = `OPORTUNIDADE 3 (${topOpportunities[2].type}): ${topOpportunities[2].legs.map((l:any) => `${l.market} (${l.match})`).join(" + ")} (Odd: @${topOpportunities[2].odd.toFixed(2)} | EV: ${(topOpportunities[2].ev*100).toFixed(1)}%)`;
        }

        const narrativeModel = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const narrativePrompt = `Aja como um Analista de Hedge Fund Esportivo.
Nosso Motor de Simulação Monte Carlo (25k iterações) mapeou a grade e extraiu o Top 3 Operações de Valor (EV+).

⚽ GAME SCRIPT LIDO NA TELA: "${allContexts}"

🎯 OPERAÇÃO PRINCIPAL (Para a chave 'analysis'):
Aposta: ${topPickDesc}
- Odd do Mercado: @${marketOdd.toFixed(2)}
- Probabilidade Simulada: ${combinedProb}% (Odd Justa: @${fairOdd.toFixed(2)})
- Vantagem sobre o Mercado (Edge): ${formattedEdge}%

🔄 OPERAÇÃO 2 (Para a chave 'alternativeCombination'):
${altPickDesc}

🛡️ OPERAÇÃO 3 (Para a chave 'conservativeCombination'):
${consPickDesc}

Sua tarefa: Traduzir os dados em um relatório coeso.

Formato JSON esperado:
{
  "analysis": "Fale APENAS da Operação Principal. 2 parágrafos justificando como o cenário do jogo valida a Edge de ${formattedEdge}%.",
  "alternativeCombination": "Descreva a Operação 2 como oportunidade detectada no scanner secundário. Se for 'Nenhuma', explique que a Edge secou e valide a postura conservadora do motor.",
  "conservativeCombination": "Descreva a Operação 3. Caso não exista, sugira uma gestão de stake moderada baseada no risco."
}`;

        const textResult = await narrativeModel.generateContent(narrativePrompt);
        const textData = JSON.parse(textResult.response.text());
        
        if (!textData || !textData.analysis || !textData.alternativeCombination || !textData.conservativeCombination) throw new Error();

        generatedAnalysis = textData.analysis;
        generatedAlt = textData.alternativeCombination;
        generatedCons = textData.conservativeCombination;
        
    } catch (e) {
        generatedAnalysis = `📊 **Simulação Monte Carlo (25k paths):** O motor identificou Edge de ${formattedEdge}% na operação primária. A Odd do Mercado (@${marketOdd}) é ineficiente frente à nossa Odd Justa (@${fairOdd}), configurando Valor Esperado.`;
        generatedAlt = topOpportunities.length > 1 ? `Radar Secundário: ${topOpportunities[1].legs.map((l:any)=>l.market).join(' + ')} (Odd Mercado @${topOpportunities[1].odd.toFixed(2)}).` : "Sem operações secundárias com EV superior ao benchmark.";
        generatedCons = topOpportunities.length > 2 ? `Radar Terciário: ${topOpportunities[2].legs.map((l:any)=>l.market).join(' + ')} (Odd @${topOpportunities[2].odd.toFixed(2)}).` : "Mantenha Stake de 1 Unidade e respeite a gestão de banca.";
    }

    return res.status(200).json({
        selections: finalSelections,
        combinedProb, fairOdd, marketOdd, 
        minProb: Math.max(1, combinedProb - 5), maxProb: Math.min(99, combinedProb + 5), 
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