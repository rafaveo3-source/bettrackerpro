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
// 🎲 2. DISTRIBUIÇÕES ESTOCÁSTICAS E CÓPULAS
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
// 🛠️ 3. NORMALIZAÇÃO HFT (Com Suporte Integral a HT e Races)
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

    if ((m.includes('exato') || m.includes('ímpar') || m.includes('par') || m.includes('primeiro a')) && !m.includes('race')) return null;

    const raceMatch = m.match(/race\s*(\d+)/i);
    const lineMatch = m.match(/(?:mais|menos|over|under|acima|abaixo)[^\d]*(\d+(\.\d+)?)/i);

    if (raceMatch) {
        type = 'race';
        line = parseInt(raceMatch[1]);
    } else if (lineMatch) {
        line = parseFloat(lineMatch[1]);
        isOver = m.includes('mais') || m.includes('over') || m.includes('acima');
    }

    const isHT = m.includes('ht') || m.includes('1º tempo') || m.includes('1o tempo') || m.includes('primeiro tempo');

    if (type !== 'race') {
        if (m.includes('gol') || m.includes('gols')) type = 'goals';
        else if (m.includes('escanteio') || m.includes('canto') || m.includes('corner')) type = 'corners';
        else if (m.includes('btts') || m.includes('ambos') || m.includes('marcam sim')) type = 'btts';
    }

    if (type === 'other') return null;

    let target = 'match';
    if (m.includes('nenhum') || m.includes('neither')) target = 'none'; 
    else if (homeTeam && m.includes(homeTeam.toLowerCase())) target = 'home';
    else if (awayTeam && m.includes(awayTeam.toLowerCase())) target = 'away';
    else if (m.includes('casa')) target = 'home';
    else if (m.includes('visitante')) target = 'away';

    const condition = type === 'btts' ? 'yes' : type === 'race' ? 'first_to' : isOver ? 'over' : 'under';
    const hash = `${type}_${target}_${condition}_${line}_${isHT ? 'ht' : 'ft'}`;

    return { type, target, line, isOver, isHT, hash };
};

const getTrueProbabilitiesFrom1X2 = (oddH: number, oddD: number, oddA: number) => {
    if (!oddH || !oddD || !oddA || isNaN(oddH) || isNaN(oddD) || isNaN(oddA)) return null;
    const pH = 1 / oddH; const pD = 1 / oddD; const pA = 1 / oddA;
    const sum = pH + pD + pA;
    if (sum === 0 || isNaN(sum)) return null;
    return { pH: pH / sum, pD: pD / sum, pA: pA / sum };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { textData, email, markets } = req.body; 
    
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente.' });
    if (!textData || textData.trim().length < 50) return res.status(400).json({ error: 'Texto insuficiente.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const geminiModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', 
        generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
    });

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    // ==========================================
    // 👁️ CAMADA 1: TEXT-TO-JSON (NLP Extractor)
    // ==========================================
    let finalValidJson = null; 

    const prompt = `Atue como um Extrator Quantitativo de Dados Pinnacle.
Leia o texto colado e estruture estritamente em JSON.

Regras Vitais:
1. Identifique os times (Ex: "Salford City v Walsall").
2. Extraia "matchOdds1x2" se houver.
3. Extraia o "teamStats" (Média de Gols, Cantos a Favor e Remates/Shots). Se não achar Remates, assuma 10.0.
4. Na chave "viablePicks", extraia TODAS as linhas do texto (mercado, odd e probabilidade).
   - EXTRAIA: "Ambas Marcam Sim", "Nenhum Race", Races Individuais, Cantos Individuais, e linhas HT (1º Tempo).

TEXTO BRUTO:
"""
${textData}
"""

Retorne APENAS JSON:
{
 "matches":[
  {
   "matchName":"Time Casa v Time Visitante",
   "matchOdds1x2": { "home": 2.15, "draw": 3.50, "away": 3.50 },
   "teamStats": {
       "home": { "goals": 1.5, "corners": 5.2, "shots": 13.0 },
       "away": { "goals": 1.1, "corners": 3.9, "shots": 10.0 }
   },
   "viablePicks":[
       {"market":"Ambas Marcam Sim","prob":80,"sampleSize":10,"extractedOdd":1.80},
       {"market":"Time Casa Mais de 3.5 Escanteios","prob":70,"sampleSize":10,"extractedOdd":1.50},
       {"market":"Mais de 0.5 Gols HT","prob":65,"sampleSize":10,"extractedOdd":1.44}
   ]
  }
 ]
}`;

    let textResult = "";
    
    try {
        const result = await geminiModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        textResult = result.response.text();
    } catch (geminiError: any) { 
        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.0,
                    response_format: { type: "json_object" }
                });
                textResult = response.choices[0].message?.content || "";
            } catch (openaiError: any) {
                throw new Error("Ambas as IAs falharam.");
            }
        } else {
            throw new Error("Erro na IA do Gemini.");
        }
    }

    try {
        textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = textResult.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) textResult = jsonMatch[0];
        
        const parsedData = JSON.parse(textResult);
        if (Array.isArray(parsedData)) finalValidJson = { matches: parsedData };
        else if (parsedData && Array.isArray(parsedData.matches)) finalValidJson = parsedData;
        else if (parsedData && parsedData.matchName) finalValidJson = { matches: [parsedData] };
        else throw new Error("JSON Inválido.");
    } catch(e) {
        throw new Error("Texto não estruturado.");
    }

    if (!finalValidJson || !finalValidJson.matches || finalValidJson.matches.length === 0) {
        throw new Error("Matriz vazia.");
    }

    // ==========================================
    // ⚙️ CAMADA 2: GAME SCRIPT & XG ENGINE
    // ==========================================
    let allProcessedLegs: any[] = [];
    let detectedGameScript = "OPEN_GAME"; 
    let tpiDiffGlobal = 0;

    for (let match of finalValidJson.matches) {
        
        const statsH = match.teamStats?.home || { goals: 1.2, corners: 4.5, shots: 10.0 };
        const statsA = match.teamStats?.away || { goals: 1.2, corners: 4.5, shots: 10.0 };

        // 🔥 XG PROXY & TPI ENGINE (Métrica Pinnacle)
        const xG_H = statsH.shots * 0.095;
        const xG_A = statsA.shots * 0.095;
        
        const blendedGoalsH = (statsH.goals * 0.4) + (xG_H * 0.6);
        const blendedGoalsA = (statsA.goals * 0.4) + (xG_A * 0.6);

        const tpiHome = (statsH.shots * 0.4) + (blendedGoalsH * 0.3) + (statsH.corners * 0.3);
        const tpiAway = (statsA.shots * 0.4) + (blendedGoalsA * 0.3) + (statsA.corners * 0.3);
        
        tpiDiffGlobal = Math.abs(tpiHome - tpiAway);

        let pH = 0.45; let pA = 0.30;
        const trueProbs = match.matchOdds1x2 ? getTrueProbabilitiesFrom1X2(Number(match.matchOdds1x2.home), Number(match.matchOdds1x2.draw), Number(match.matchOdds1x2.away)) : null;
        if (trueProbs) { pH = trueProbs.pH; pA = trueProbs.pA; }

        let market_lt = blendedGoalsH + blendedGoalsA; 
        let market_lc = statsH.corners + statsA.corners; 

        let lh = market_lt * (tpiHome / (tpiHome + tpiAway)); 
        let la = market_lt * (tpiAway / (tpiHome + tpiAway));

        // GAME SCRIPT CLASSIFIER
        const homeDominance = tpiHome / (tpiHome + tpiAway);
        if (pH > 0.40 && homeDominance > 0.55) {
            detectedGameScript = "HOME_PRESSURE";
        } else if (pA > 0.40 && (1 - homeDominance) > 0.55) {
            detectedGameScript = "AWAY_PRESSURE";
        } else if (market_lt < 2.2) {
            detectedGameScript = "LOW_TEMPO";
        } else {
            detectedGameScript = "OPEN_GAME";
        }

        const l3 = Math.min(0.25, market_lt * 0.07);
        const l1 = Math.max(0.1, lh - l3);
        const l2 = Math.max(0.1, la - l3);

        const teams = (match.matchName || '').split(/ v | vs | - /i);
        const homeTeam = teams[0] ? teams[0].trim() : 'Casa';
        const awayTeam = teams[1] ? teams[1].trim() : 'Visitante';

        const activeMarketsMap = new Map();
        
        if (match.viablePicks) {
            for (let pick of match.viablePicks) {
                const norm = normalizeMarket(pick.market || '', match.matchName || '');
                if (!norm) continue; 
                if (!activeMarketsMap.has(norm.hash)) activeMarketsMap.set(norm.hash, { norm, hits: 0, ref: pick });
            }
        }

        // 🔥 TEMPLATES CAUSAIS (Com HT e Ambas Forte)
        let smartLines: string[] = [];
        
        if (detectedGameScript === "HOME_PRESSURE") {
            smartLines = [
                `${homeTeam} Mais de 0.5 Gols`, `${homeTeam} Mais de 1.5 Gols`, "Mais de 1.5 Gols", "Ambas Marcam Sim",
                `${homeTeam} Mais de 2.5 Escanteios`, `${homeTeam} Mais de 3.5 Escanteios`, `${homeTeam} Mais de 4.5 Escanteios`,
                "Mais de 7.5 Escanteios", "Mais de 8.5 Escanteios",
                `${homeTeam} Race 3`, `${homeTeam} Race 5`, "Mais de 0.5 Gols HT"
            ];
        } else if (detectedGameScript === "AWAY_PRESSURE") {
            smartLines = [
                `${awayTeam} Mais de 0.5 Gols`, `${awayTeam} Mais de 1.5 Gols`, "Mais de 1.5 Gols", "Ambas Marcam Sim",
                `${awayTeam} Mais de 2.5 Escanteios`, `${awayTeam} Mais de 3.5 Escanteios`, `${awayTeam} Mais de 4.5 Escanteios`,
                "Mais de 7.5 Escanteios", "Mais de 8.5 Escanteios",
                `${awayTeam} Race 3`, `${awayTeam} Race 5`, "Mais de 0.5 Gols HT"
            ];
        } else if (detectedGameScript === "LOW_TEMPO") {
            smartLines = [
                "Menos de 2.5 Gols", "Menos de 3.5 Gols", "Menos de 1.5 Gols HT",
                "Menos de 9.5 Escanteios", "Menos de 10.5 Escanteios",
                "Nenhum Race 5", "Nenhum Race 7"
            ];
        } else {
            // OPEN GAME (Fleetwood vs Cheltenham Style)
            smartLines = [
                "Mais de 1.5 Gols", "Mais de 2.5 Gols", "Ambas Marcam Sim", "Mais de 0.5 Gols HT",
                "Mais de 7.5 Escanteios", "Mais de 8.5 Escanteios",
                `${homeTeam} Mais de 0.5 Gols`, `${awayTeam} Mais de 0.5 Gols`,
                `${homeTeam} Race 3`, `${awayTeam} Race 3`
            ];
        }

        for (let sm of smartLines) {
            const norm = normalizeMarket(sm, match.matchName || '');
            if (norm && !activeMarketsMap.has(norm.hash)) {
                activeMarketsMap.set(norm.hash, { norm, hits: 0, ref: { market: sm, sampleSize: 10, extractedOdd: 0, confidence: 1.0 } });
            }
        }
        
        const activeMarkets = Array.from(activeMarketsMap.values());
        if (activeMarkets.length === 0) continue; 

        const ITERATIONS = 25000;
        let homeCornerShare = tpiHome / (tpiHome + tpiAway);

        // 🔥 MONTE CARLO COM HT E DISPERSÃO REAL DE CANTOS
        for (let i = 0; i < ITERATIONS; i++) {
            // HT Sim (A Mágica do Primeiro Tempo ~ 44% dos Gols)
            const z_ht = poissonSample(l3 * 0.44);
            const goalsHomeHT = poissonSample(l1 * 0.44) + z_ht;
            const goalsAwayHT = poissonSample(l2 * 0.44) + z_ht;
            const totalGoalsHT = goalsHomeHT + goalsAwayHT;

            // FT Sim
            const z = poissonSample(l3);
            const goalsHome = poissonSample(l1) + z;
            const goalsAway = poissonSample(l2) + z;
            const totalGoals = goalsHome + goalsAway;

            // Game Kill Factor
            let gameKillFactor = 1.0;
            if (Math.abs(goalsHome - goalsAway) >= 2) gameKillFactor = 0.70; 

            const baseCornerRate = (statsH.corners + statsA.corners) * 0.4;
            const shotPressure = ((statsH.shots + statsA.shots) / 20) * 0.6;
            const adjustedCornerMean = (baseCornerRate + shotPressure * market_lc) * gameKillFactor;
            
            // 🔥 VARIÂNCIA REAL DE ESCANTEIOS (1.2 + Mean * 0.25)
            const dispersion = 1.2 + (adjustedCornerMean * 0.25); 
            let corners = negativeBinomialSample(adjustedCornerMean, dispersion);
            corners = Math.min(corners, 22);

            let cornersHome = 0; let cornersAway = 0;
            let race3Winner = 'none'; let race5Winner = 'none'; let race7Winner = 'none'; let race9Winner = 'none';

            for (let c = 0; c < corners; c++) {
                if (Math.random() < homeCornerShare) cornersHome++;
                else cornersAway++;

                if (cornersHome === 3 && race3Winner === 'none') race3Winner = 'home';
                if (cornersAway === 3 && race3Winner === 'none') race3Winner = 'away';
                if (cornersHome === 5 && race5Winner === 'none') race5Winner = 'home';
                if (cornersAway === 5 && race5Winner === 'none') race5Winner = 'away';
                if (cornersHome === 7 && race7Winner === 'none') race7Winner = 'home';
                if (cornersAway === 7 && race7Winner === 'none') race7Winner = 'away';
                if (cornersHome === 9 && race9Winner === 'none') race9Winner = 'home';
                if (cornersAway === 9 && race9Winner === 'none') race9Winner = 'away';
            }

            for (let j = 0; j < activeMarkets.length; j++) {
                const mkt = activeMarkets[j];
                const norm = mkt.norm;
                let isHit = false;

                // Avalia HT ou FT dependendo da flag
                let simGoals = norm.isHT ? totalGoalsHT : totalGoals;
                if (norm.target === 'home') simGoals = norm.isHT ? goalsHomeHT : goalsHome;
                if (norm.target === 'away') simGoals = norm.isHT ? goalsAwayHT : goalsAway;

                let simCorners = corners;
                if (norm.target === 'home') simCorners = cornersHome;
                if (norm.target === 'away') simCorners = cornersAway;

                if (norm.type === 'goals') {
                    isHit = norm.isOver ? (simGoals > norm.line) : (simGoals < norm.line);
                } else if (norm.type === 'corners') {
                    isHit = norm.isOver ? (simCorners > norm.line) : (simCorners < norm.line);
                } else if (norm.type === 'btts') {
                    if (norm.isHT) isHit = (goalsHomeHT > 0 && goalsAwayHT > 0);
                    else isHit = (goalsHome > 0 && goalsAway > 0);
                } else if (norm.type === 'race') {
                    if (norm.target === 'none') {
                        if (norm.line === 3) isHit = (race3Winner === 'none');
                        if (norm.line === 5) isHit = (race5Winner === 'none');
                        if (norm.line === 7) isHit = (race7Winner === 'none');
                    } else {
                        if (norm.line === 3) isHit = (norm.target === 'home' && race3Winner === 'home') || (norm.target === 'away' && race3Winner === 'away');
                        else if (norm.line === 5) isHit = (norm.target === 'home' && race5Winner === 'home') || (norm.target === 'away' && race5Winner === 'away');
                        else if (norm.line === 7) isHit = (norm.target === 'home' && race7Winner === 'home') || (norm.target === 'away' && race7Winner === 'away');
                    }
                }
                
                if (isHit) mkt.hits++;
            }
        }

        // 🔥 FILTRO (Permite pernas sólidas e remove lixo)
        for (let mkt of activeMarkets) {
            const pick = mkt.ref;
            let rawProb = mkt.hits / ITERATIONS;
            rawProb = Math.max(0.01, Math.min(rawProb * (rawProb > 0.85 ? 0.96 : 1), 0.98));

            const fairOdd = 1 / rawProb;
            
            let rawOdd = Number(pick.extractedOdd);
            if (!rawOdd || isNaN(rawOdd) || rawOdd === 1.50 || rawOdd === 0) {
                rawOdd = fairOdd * 0.92; 
            }
            
            const finalOdd = Math.min(Math.max(rawOdd, 1.01), 10.0);

            if (rawProb < 0.40) continue; 
            if (finalOdd > 2.50) continue; 
            if (finalOdd < 1.05) continue; // Permite Anchor Legs de @1.05

            allProcessedLegs.push({
                match: match.matchName,
                market: pick.market,
                normHash: mkt.norm.hash,
                mktType: mkt.norm.type,      
                mktTarget: mkt.norm.target, 
                rawProb: rawProb,
                extractedOdd: finalOdd,
                confidence: 1.0,
                samplePenalty: 1.0 
            });
        }
    }

    // ==========================================
    // 💡 PASSO 3: CÓPULA GAUSSIANA E OTIMIZADOR
    // ==========================================
    let opportunities: any[] = [];
    
    const BUILDER_MIN = 1.55; 
    const BUILDER_MAX = 2.30; 
    const EDGE_MIN = -0.05; 

    // SINGLES PREMIUM (Resgata o Ambas Marcam de Valor)
    for (let leg of allProcessedLegs) {
        if (leg.extractedOdd < BUILDER_MIN || leg.extractedOdd > BUILDER_MAX) continue;

        const marketProb = 1 / leg.extractedOdd;
        const edge = leg.rawProb - marketProb; 
        const ev = (leg.rawProb * leg.extractedOdd) - 1; 
        
        if (edge >= EDGE_MIN) {
            // Boost pesado para Singles Premium (como BTTS ou Race seco) que encaixam no target
            const isPremiumSingle = leg.mktType === 'btts' || leg.mktType === 'race';
            const score = edge * entropyWeight(leg.rawProb) * (isPremiumSingle ? 2.0 : 1.5); 
            opportunities.push({ type: 'Simples', legs: [leg], prob: leg.rawProb, odd: leg.extractedOdd, ev, edge, score });
        }
    }

    // DUPLAS COM CÓPULA
    for (let i = 0; i < allProcessedLegs.length; i++) {
        for (let j = i + 1; j < allProcessedLegs.length; j++) {
            const l1 = allProcessedLegs[i];
            const l2 = allProcessedLegs[j];
            const isSameGame = l1.match === l2.match;

            if (isSameGame && l1.mktType === l2.mktType && l1.mktTarget === l2.mktTarget) continue;
            if (isSameGame && l1.mktType === 'goals' && l2.mktType === 'goals' && (l1.mktTarget === 'match' || l2.mktTarget === 'match')) continue;

            const isL1CornerOrRace = l1.mktType === 'corners' || l1.mktType === 'race';
            const isL2CornerOrRace = l2.mktType === 'corners' || l2.mktType === 'race';
            if (isSameGame && isL1CornerOrRace && isL2CornerOrRace) continue;

            let p1 = l1.rawProb;
            let p2 = l2.rawProb;
            let combProb = p1 * p2;

            // 🔥 CORRELAÇÃO DE CÓPULA GAUSSIANA (A Magia Quantitativa)
            if (isSameGame) {
                if (l1.mktTarget === l2.mktTarget && l1.mktTarget !== 'match' && l1.mktType !== l2.mktType) {
                    // Correlação Máxima (Gols Equipe + Cantos Equipe). Rho sobe baseado no TPI Diff.
                    let rho = 0.20 + Math.min(tpiDiffGlobal * 0.02, 0.15); // Max 0.35
                    combProb = (p1 * p2) + rho * Math.sqrt(p1 * (1 - p1) * p2 * (1 - p2));
                } 
                else if (l1.mktTarget !== l2.mktTarget && l1.mktType !== l2.mktType) {
                    // Correlação Moderada
                    let rho = 0.10 + Math.min(tpiDiffGlobal * 0.01, 0.10);
                    combProb = (p1 * p2) + rho * Math.sqrt(p1 * (1 - p1) * p2 * (1 - p2));
                }
                else {
                    combProb *= 0.95; // Taxa normal
                }
            }
            
            combProb = Math.max(0.01, Math.min(combProb, 0.98));
            const combOdd = l1.extractedOdd * l2.extractedOdd;
            const marketProb = 1 / combOdd;
            const edge = combProb - marketProb;
            const ev = (combProb * combOdd) - 1;

            if (combOdd >= BUILDER_MIN && combOdd <= BUILDER_MAX && edge >= EDGE_MIN) {
                const isSmartBuilder = isSameGame && l1.mktType !== l2.mktType;
                const score = edge * entropyWeight(combProb) * (isSmartBuilder ? 2.5 : 1.0);
                
                opportunities.push({ 
                    type: isSameGame ? `Smart Builder: ${detectedGameScript}` : 'Dupla Cruzada', 
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
        throw new Error(`NO BET: O Game Script (${detectedGameScript}) foi lido, mas a Cópula Gaussiana não encontrou margem segura de EV no range @1.55 - @2.30.`);
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
    const riskLabel = bestOpp.prob < 0.45 ? "ALTO" : bestOpp.prob >= 0.60 ? "BAIXO" : "MÉDIO";

    // =====================================================
    // ✍️ CAMADA 5: RELATÓRIO PINNACLE
    // =====================================================
    const topPickDesc = bestOpp.legs.map((l:any) => `${l.market}`).join(" + ");

    const generatedAnalysis = `Classificação Tática: [${detectedGameScript}]. O algoritmo identificou a operação "${topPickDesc}" como o ápice de Valor Esperado (EV+) no range alvo.\n\nUtilizando a aproximação de Cópula Gaussiana combinada ao xG Proxy (Remates como métrica de pressão), a dependência não-linear dos eventos elevou a Probabilidade Real para ${combinedProb}% (Odd Justa @${fairOdd.toFixed(2)}). Esta é a fundação quantitativa que os Syndicates utilizam para bater as margens das casas em mercados correlacionados.`;

    let generatedAlt = "";
    if (topOpportunities.length > 1) {
        const altOp = topOpportunities[1];
        const altDesc = altOp.legs.map((l:any) => `${l.market}`).join(" + ");
        generatedAlt = `OPORTUNIDADE 2 (${altOp.type}): ${altDesc} (Odd Simulada: @${altOp.odd.toFixed(2)}). Alternativa retida pela aderência ao xG Model.`;
    } else {
        generatedAlt = "Filtro de Cópula aplicou exclusão de risco em linhas conflitantes remanescentes.";
    }

    let generatedCons = "";
    if (topOpportunities.length > 2) {
        const consOp = topOpportunities[2];
        const consDesc = consOp.legs.map((l:any) => `${l.market}`).join(" + ");
        generatedCons = `OPORTUNIDADE 3: ${consDesc} (Odd Simulada: @${consOp.odd.toFixed(2)}).`;
    } else {
        generatedCons = `Respeite a gestão de banca frente à variância natural de HT/FT (Risco: ${riskLabel}).`;
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
    return res.status(400).json({ error: error.message || 'Erro ao processar o Game Script.' });
  }
}