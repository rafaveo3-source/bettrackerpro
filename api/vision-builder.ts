import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

// ==========================================
// 🧠 1. MOTOR DE TEORIA DA INFORMAÇÃO E SRE
// ==========================================
const shannonEntropy = (p: number) => {
    if (p <= 0 || p >= 1 || isNaN(p)) return 0;
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
    if (isNaN(lambda) || isNaN(k) || lambda < 0 || k < 0) return 0;
    let sum = 0;
    const limit = Math.min(k, 50); 
    for (let i = 0; i <= limit; i++) sum += (Math.pow(lambda, i) * Math.exp(-lambda)) / factorial(i);
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
    if (isNaN(shape) || shape <= 0 || isNaN(scale) || scale <= 0) return 0;
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
    if (isNaN(lambda) || lambda <= 0) return 0;
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
    if (isNaN(mean) || isNaN(dispersion) || dispersion <= 0) return 0;
    const scale = mean / dispersion;
    const lambda = randomGamma(dispersion, scale);
    return poissonSample(lambda);
};

// ==========================================
// 🛠️ 3. NORMALIZAÇÃO HFT
// ==========================================
const normalizeMarket = (marketStr: string, matchName: string) => {
    if (!marketStr || !matchName) return null;
    const m = marketStr.toLowerCase();
    const teams = matchName.toLowerCase().split(/ v | vs | - /);
    const homeTeam = teams[0] ? teams[0].trim() : '';
    const awayTeam = teams[1] ? teams[1].trim() : '';

    let type = 'other';
    let line = 0;
    let isOver = false;

    if (m.includes('race') || m.includes('exato') || m.includes('ímpar') || m.includes('par') || m.includes('primeiro a')) return null;

    const lineMatch = m.match(/(?:mais|menos|over|under|acima|abaixo)[^\d]*(\d+(\.\d+)?)/i);
    if (lineMatch) line = parseFloat(lineMatch[1]);

    isOver = m.includes('mais') || m.includes('over') || m.includes('acima');
    const isHT = m.includes('ht') || m.includes('1º tempo') || m.includes('1o tempo') || m.includes('primeiro');

    if (m.includes('gol') || m.includes('gols')) type = 'goals';
    else if (m.includes('escanteio') || m.includes('canto') || m.includes('corner')) type = 'corners';
    else if (m.includes('btts') || m.includes('ambos')) type = 'btts';

    if (type === 'other') return null;

    let target = 'match';
    if (homeTeam && m.includes(homeTeam)) target = 'home';
    else if (awayTeam && m.includes(awayTeam)) target = 'away';
    else if (m.includes('casa')) target = 'home';
    else if (m.includes('visitante')) target = 'away';

    if (type === 'corners' && target !== 'match') return null; 

    const condition = type === 'btts' ? 'yes' : isOver ? 'over' : 'under';
    const hash = `${type}_${target}_${condition}_${line}_${isHT ? 'ht' : 'ft'}`;

    return { type, target, line, isOver, isHT, hash };
};

// ==========================================
// 🎯 4. PRICING & BLENDED PRIORS 
// ==========================================
const getTrueProbabilitiesFrom1X2 = (oddH: number, oddD: number, oddA: number) => {
    if (!oddH || !oddD || !oddA || isNaN(oddH) || isNaN(oddD) || isNaN(oddA)) return null;
    const pH = 1 / oddH; const pD = 1 / oddD; const pA = 1 / oddA;
    const sum = pH + pD + pA;
    if (sum === 0 || isNaN(sum)) return null;
    return { pH: pH / sum, pD: pD / sum, pA: pA / sum };
};

const estimateLambdaFromMarket = (lines: {line: number, prob: number}[]) => {
    if (!lines || lines.length < 2) return null; 
    let bestLambda = 2.5; let bestError = Infinity;
    for (let lambda = 0.5; lambda <= 4.5; lambda += 0.05) {
        let error = 0;
        for (let l of lines) {
            const k = Math.floor(l.line); 
            if (isNaN(k)) continue;
            const targetProb = l.prob > 1 ? l.prob / 100 : l.prob;
            const safeProb = Math.min(Math.max(targetProb, 0.05), 0.95);
            const weight = Math.min(1 / (safeProb * (1 - safeProb)), 10); 
            error += weight * Math.pow((1 - poissonCDF(lambda, k)) - targetProb, 2);
        }
        if (error < bestError && !isNaN(error)) { bestError = error; bestLambda = lambda; }
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
            if (isNaN(k)) continue;
            const targetProb = l.prob > 1 ? l.prob / 100 : l.prob;
            const safeProb = Math.min(Math.max(targetProb, 0.05), 0.95);
            const weight = Math.min(1 / (safeProb * (1 - safeProb)), 10);
            error += weight * Math.pow((1 - poissonCDF(lambda, k)) - targetProb, 2);
        }
        if (error < bestError && !isNaN(error)) { bestError = error; bestLambda = lambda; }
    }
    return bestLambda;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    // ✅ Agora recebemos textData (o texto colado) em vez de images
    const { textData, email, markets } = req.body; 
    
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente.' });
    if (!textData || textData.trim().length < 50) return res.status(400).json({ error: 'Texto insuficiente para análise estatística.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const geminiModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', // Flash 1.5 é absurdamente rápido e ótimo para extração de texto
        generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
    });

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    // ==========================================
    // 👁️ CAMADA 1: TEXT-TO-JSON (O Fim do OCR de Imagem)
    // ==========================================
    let finalValidJson = null; 

    // Prompt altamente tunado para estruturar dados textuais bagunçados de sites esportivos
    const prompt = `Atue como um Analista de Dados de Apostas.
Vou te fornecer um texto bruto copiado de um site de estatísticas de futebol (ex: CornerPro ou Sofascore).
Sua missão é varrer esse texto, identificar de qual jogo se trata, e extrair as probabilidades estatísticas (Hit Rates) em um formato JSON estrito.

Regras de Extração:
1. Identifique os times (Ex: "Lazio v Sassuolo").
2. Encontre as odds 1x2 (se houver). Se não houver, retorne null.
3. Extraia o array de "goalMarketLines" (ex: Over 1.5, 2.5) e suas probabilidades (ex: 80 para 80%).
4. Extraia o array de "cornerMarketLines" (ex: Over 8.5) e suas probabilidades.
5. Na chave "viablePicks", crie uma lista limpa com TODAS as estatísticas que você encontrar no texto que sejam relevantes para apostas (ex: "Mais de 2.5 Gols", "Mais de 8.5 Escanteios", "Ambas Marcam").
   - Se você encontrar menções a Odd no texto, extraia. Se não houver odd explícita, use 1.50.

TEXTO BRUTO DO USUÁRIO:
"""
${textData}
"""

Retorne APENAS um JSON válido neste formato:
{
 "matches":[
  {
   "matchName":"Time Casa v Time Visitante",
   "matchContext":"Resumo rápido do confronto baseado nos dados (ex: Jogo com forte tendência a gols)",
   "matchOdds1x2": { "home": 2.15, "draw": 3.50, "away": 3.50 },
   "goalMarketLines":[{"line":1.5,"prob":80}, {"line":2.5,"prob":45}],
   "cornerMarketLines":[{"line":8.5,"prob":75}, {"line":9.5,"prob":50}],
   "viablePicks":[
    {"market":"Mais de 1.5 Gols","prob":80,"sampleSize":10,"extractedOdd":1.40}
   ]
  }
 ]
}`;

    let textResult = "";
    
    try {
        // Tenta com Gemini (Super barato para texto)
        const result = await geminiModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        textResult = result.response.text();

    } catch (geminiError: any) { 
        console.error("❌ Gemini NLP Falhou:", geminiError.message);
        
        // Se der Rate Limit ou o Gemini cair, o OpenAI assume o texto na hora.
        if (openai) {
            console.log("🔄 Acionando fallback para OpenAI (GPT-4o-mini text mode)...");
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.0,
                    response_format: { type: "json_object" }
                });
                textResult = response.choices[0].message?.content || "";
            } catch (openaiError: any) {
                console.error("❌ OpenAI NLP falhou:", openaiError.message);
                throw new Error("Ambas as IAs falharam na extração do texto.");
            }
        } else {
            throw new Error("Erro na IA do Gemini e sem fallback configurado.");
        }
    }

    try {
        textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = textResult.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) textResult = jsonMatch[0];
        
        const parsedData = JSON.parse(textResult);
        
        if (Array.isArray(parsedData)) {
            finalValidJson = { matches: parsedData };
        } else if (parsedData && Array.isArray(parsedData.matches)) {
            finalValidJson = parsedData;
        } else if (parsedData && parsedData.matchName) {
            finalValidJson = { matches: [parsedData] };
        } else {
            throw new Error("JSON não contém dados.");
        }
    } catch(e) {
        throw new Error("O texto fornecido não continha dados estatísticos estruturados suficientes.");
    }

    if (!finalValidJson || !finalValidJson.matches || finalValidJson.matches.length === 0) {
        throw new Error("A IA leu o texto, mas não conseguiu formar a matriz de dados. Copie tabelas mais completas.");
    }

    // ==========================================
    // ⚙️ CAMADA 2: ON-THE-FLY MONTE CARLO ENGINE (Mantido idêntico)
    // ==========================================
    let allProcessedLegs: any[] = [];
    let globalContextArray: string[] = []; 

    for (let match of finalValidJson.matches) {
        if (match.matchContext) globalContextArray.push(`${match.matchName}: ${match.matchContext}`);
        if (!match.viablePicks || match.viablePicks.length === 0) continue;
        
        let market_lt = 2.6; 
        let market_lc = 10.0; 
        
        const trueProbs = match.matchOdds1x2 ? getTrueProbabilitiesFrom1X2(Number(match.matchOdds1x2.home), Number(match.matchOdds1x2.draw), Number(match.matchOdds1x2.away)) : null;
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
            const norm = normalizeMarket(pick.market || '', match.matchName || '');
            if (!norm) continue; 
            if (!activeMarketsMap.has(norm.hash)) {
                activeMarketsMap.set(norm.hash, { norm, hits: 0, ref: pick });
            }
        }

        // 🔥 AUTO-INJETOR DO "FEELING DO APOSTADOR" 
        const standardBettorLines = [
            "Mais de 0.5 Gols", "Mais de 1.5 Gols", "Mais de 2.5 Gols",
            "Mais de 0.5 Gols HT",
            "Mais de 3.5 Escanteios", "Mais de 4.5 Escanteios", "Mais de 5.5 Escanteios", 
            "Mais de 6.5 Escanteios", "Mais de 7.5 Escanteios", "Mais de 8.5 Escanteios"
        ];

        for (let sm of standardBettorLines) {
            const norm = normalizeMarket(sm, match.matchName || '');
            if (norm && !activeMarketsMap.has(norm.hash)) {
                activeMarketsMap.set(norm.hash, { 
                    norm, 
                    hits: 0, 
                    ref: { market: sm, sampleSize: 10, extractedOdd: 0, confidence: 1.0 }
                });
            }
        }
        
        const activeMarkets = Array.from(activeMarketsMap.values());
        if (activeMarkets.length === 0) continue; 

        const ITERATIONS = 25000;

        for (let i = 0; i < ITERATIONS; i++) {
            const z = poissonSample(l3);
            const goalsHome = poissonSample(l1) + z;
            const goalsAway = poissonSample(l2) + z;
            const totalGoals = goalsHome + goalsAway;

            const pressure = totalGoals;
            const adjustedCornerMean = market_lc * (1 + pressure * 0.04);
            const dispersion = 2.0 + (Math.sqrt(pressure) * 0.8); 
            let corners = negativeBinomialSample(adjustedCornerMean, dispersion);
            corners = Math.min(corners, 22);

            const z_ht = poissonSample(l3 * 0.45);
            const goalsHomeHT = poissonSample(l1 * 0.45) + z_ht;
            const goalsAwayHT = poissonSample(l2 * 0.45) + z_ht;
            const totalGoalsHT = goalsHomeHT + goalsAwayHT;
            
            const pressureHT = totalGoalsHT;
            const adjustedCornerMeanHT = (market_lc * 0.45) * (1 + pressureHT * 0.04);
            const dispersionHT = 2.0 + (Math.sqrt(pressureHT) * 0.8);
            let cornersHT = negativeBinomialSample(adjustedCornerMeanHT, dispersionHT);
            cornersHT = Math.min(cornersHT, 12);

            for (let j = 0; j < activeMarkets.length; j++) {
                const mkt = activeMarkets[j];
                const norm = mkt.norm;
                let isHit = false;

                let simGoals = norm.isHT ? totalGoalsHT : totalGoals;
                if (norm.target === 'home') simGoals = norm.isHT ? goalsHomeHT : goalsHome;
                if (norm.target === 'away') simGoals = norm.isHT ? goalsAwayHT : goalsAway;

                const simCorners = norm.isHT ? cornersHT : corners;

                if (norm.type === 'goals') {
                    isHit = norm.isOver ? (simGoals > norm.line) : (simGoals < norm.line);
                } else if (norm.type === 'corners') {
                    isHit = norm.isOver ? (simCorners > norm.line) : (simCorners < norm.line);
                } else if (norm.type === 'btts') {
                    if (norm.isHT) {
                        isHit = (goalsHomeHT > 0 && goalsAwayHT > 0);
                    } else {
                        isHit = (goalsHome > 0 && goalsAway > 0);
                    }
                }
                
                if (isHit) mkt.hits++;
            }
        }

        for (let mkt of activeMarkets) {
            const pick = mkt.ref;
            let realSample = Number(pick.sampleSize);
            if (!realSample || realSample < 6) continue;

            let rawProb = mkt.hits / ITERATIONS;
            rawProb = Math.max(0.01, Math.min(rawProb * (rawProb > 0.85 ? 0.96 : 1), 0.98));

            const fairOdd = 1 / rawProb;
            
            // 🔥 PRECIFICADOR SINTÉTICO HFT
            let rawOdd = Number(pick.extractedOdd);
            if (!rawOdd || isNaN(rawOdd) || rawOdd === 1.50 || rawOdd === 0) {
                rawOdd = fairOdd * 0.92; // 8% Juice
            }
            
            const finalOdd = Math.min(Math.max(rawOdd, 1.01), 10.0);

            const maxOddTolerance = rawProb > 0.65 ? 1.25 : 1.40;
            if (finalOdd > fairOdd * maxOddTolerance) continue; 
            
            if (finalOdd < 1.05) continue; 

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
    const ODD_MIN = 1.40;
    const ODD_MAX = 3.00;
    const EDGE_MIN = -0.05; 

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
            if (isSameGame) combProb *= 0.98; 
            
            combProb = Math.max(0.01, Math.min(combProb, 0.98));
            const combOdd = l1.extractedOdd * l2.extractedOdd;
            const marketProb = 1 / combOdd;
            const edge = combProb - marketProb;
            const ev = (combProb * combOdd) - 1;

            if (combOdd >= ODD_MIN && combOdd <= ODD_MAX && edge >= EDGE_MIN) {
                const avgConf = (l1.confidence + l2.confidence) / 2;
                const avgSamplePen = (l1.samplePenalty + l2.samplePenalty) / 2;
                
                // 🔥 BET BUILDER BOOST (Privilegia as duplas que o usuário ama)
                const score = edge * entropyWeight(combProb) * avgConf * avgSamplePen * (isSameGame ? 1.5 : 1.0);
                
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
        throw new Error("NO BET: O Scanner Monte Carlo rodou a matriz e não encontrou assimetrias matemáticas seguras no range de Odds definido.");
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
    // ✍️ CAMADA 5: RELATÓRIO ESTATÍSTICO NATIVO
    // =====================================================
    const topPickDesc = bestOpp.legs.map((l:any) => `${l.market} (${l.match})`).join(" + ");

    const generatedAnalysis = `A operação principal identificada pelo nosso Motor NLP Quantitativo é a "${topPickDesc}". Após processarmos o texto colado e cruzarmos as linhas com nosso gerador Monte Carlo de 25.000 paths (Poisson Bivariado), validamos a expectativa técnica do confronto. A probabilidade matemática deste bilhete é de ${combinedProb}%, precificando a Odd Justa (Fair Odd) em @${fairOdd.toFixed(2)}.\n\nA combinação das pernas (Gols/Cantos) reflete o Game Script mais provável abstraído dos dados do usuário, configurando uma aposta de Valor Esperado positivo contra o desajuste do mercado.`;

    let generatedAlt = "";
    if (topOpportunities.length > 1) {
        const altOp = topOpportunities[1];
        const altDesc = altOp.legs.map((l:any) => `${l.market} (${l.match})`).join(" + ");
        generatedAlt = `OPORTUNIDADE SECUNDÁRIA (${altOp.type}): ${altDesc} (Odd Mercado Simulado: @${altOp.odd.toFixed(2)} | EV: ${(altOp.ev*100).toFixed(1)}%). O motor preservou esta opção no radar tático.`;
    } else {
        generatedAlt = "O scanner não detectou nenhuma alternativa primária com Valor Esperado sólido para compor a grade de backup. O EV do jogo está esgotado na aposta primária.";
    }

    let generatedCons = "";
    if (topOpportunities.length > 2) {
        const consOp = topOpportunities[2];
        const consDesc = consOp.legs.map((l:any) => `${l.market} (${l.match})`).join(" + ");
        generatedCons = `OPORTUNIDADE DE COBERTURA (${consOp.type}): ${consDesc} (Odd: @${consOp.odd.toFixed(2)}).`;
    } else {
        generatedCons = `Devido à variação técnica do confronto, sugere-se uma gestão de banca rigorosa alinhada ao nível de Risco ${riskLabel}.`;
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
    console.error("Erro Engine NLP:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar cotações textuais.' });
  }
}