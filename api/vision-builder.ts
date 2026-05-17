import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

// ==========================================
// 🧠 1. MOTOR DE TEORIA DA INFORMAÇÃO 
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
// 🛠️ 3. SPORTSBOOK MAPPING
// ==========================================
const VALID_LINES = {
    goals: [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
    corners: [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5],
    team_corners: [2.5, 3.5, 4.5, 5.5, 6.5, 7.5]
};

const validateMarketLine = (type: string, line: number, target: string) => {
    if (type === "goals") return VALID_LINES.goals.includes(line);
    if (type === "corners" && target === "match") return VALID_LINES.corners.includes(line);
    if (type === "corners" && target !== "match") return VALID_LINES.team_corners.includes(line);
    if (type === "btts" || type === "race") return true; 
    return false;
};

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

    if (type === 'corners' && target === 'match' && line < 6.5) return null;

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
    if (!textData || textData.trim().length < 20) return res.status(400).json({ error: 'Texto insuficiente.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const geminiModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', 
        generationConfig: { temperature: 0.0, responseMimeType: "application/json" }
    });

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    // ==========================================
    // 👁️ CAMADA 1: NLP EXTRACTOR
    // ==========================================
    let finalValidJson = null; 

    const prompt = `Atue como um Analista Quantitativo Institucional e Extrator de Dados Pinnacle. Leia o texto colado e estruture estritamente em JSON.
[MERCADOS_PERMITIDOS]: ${markets ? JSON.stringify(markets) : 'Todos'}.

Regras Vitais e Absolutas (Omni-Market EV-First):
1. CONFINAMENTO MODULAR DE MERCADO: VOCÊ RECEBEU UM ARRAY CHAMADO [MERCADOS_PERMITIDOS]. É ESTRITAMENTE PROIBIDO RECOMENDAR, ANALISAR OU MENCIONAR QUALQUER MERCADO QUE NÃO ESTEJA EXATAMENTE NESTA LISTA. Você DEVE analisar cada mercado do array [MERCADOS_PERMITIDOS] de forma 100% INDEPENDENTE. Se um mercado (ex: BTTS) não for enviado na lista, ignore-o completamente, mas não deixe de buscar e recomendar apostas de +EV nos OUTROS mercados permitidos. Gere seleções separadas para Gols, Cantos, etc. Se a opção "Bet Builder Combinado" estiver permitida, construa combinações usando APENAS os outros mercados permitidos na lista.
2. Alvo Principal: Encontrar o maior EV+ real e probabilidade de Green, APENAS dentro dos mercados permitidos.
3. Range Operacional: Focar em extrair mercados com odds justas entre @1.40 e @2.00.
4. Viés Neutro: Avalie com a mesma força mercados de Under, BTTS Não e Empates. O valor pode estar contra a intuição.
5. Kill Switch (Regra de Aborto): Se o texto colado não contiver dados suficientes para embasar matematicamente uma aposta, ou se NENHUM mercado tiver EV+ claro, VOCÊ DEVE RETORNAR ESTRITAMENTE: {"NO_BET": true, "reason": "Faltam dados críticos (ex: xG, cantos) ou não há valor (+EV) claro."}. É terminantemente proibido alucinar apostas ou forçar recomendações!
6. Se houver valor, estruture os dados:
   - Identifique os times (Ex: "Salford City v Walsall").
   - Extraia "matchOdds1x2" se houver.
   - Extraia o "teamStats" (Média de Gols, Cantos a Favor, Cartões e Remates/Shots). Se não achar Remates, assuma 10.0.
   - Na chave "viablePicks", extraia linhas apenas dos mercados que apresentarem EV+, respeitando o Range Operacional. Para cada pick, VOCÊ DEVE retornar "marketCategory" contendo a exata string do array [MERCADOS_PERMITIDOS] que autorizou essa recomendação.

TEXTO BRUTO:
"""
${textData}
"""

Se houver valor, retorne APENAS JSON válido, seguindo esta exata estrutura:
{"matches":[{"matchName":"","matchOdds1x2":{"home":2.0,"draw":3.0,"away":3.0},"teamStats":{"home":{"goals":1.5,"corners":5.0,"shots":10.0},"away":{"goals":1.0,"corners":4.0,"shots":8.0}},"viablePicks":[{"market":"","marketCategory":"","prob":80,"sampleSize":10,"extractedOdd":1.80}]}]}
Se não houver valor, retorne APENAS: {"NO_BET": true, "reason": "Motivo da rejeição."}`;

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
        
        if (parsedData.NO_BET) {
            return res.status(200).json({ NO_BET: true, reason: parsedData.reason });
        }
        
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
    // ⚙️ CAMADA 2: XG ENGINE E SCRIPT MODEL
    // ==========================================
    let allProcessedLegs: any[] = [];
    let detectedGameScript = "OPEN_GAME"; 
    let tpiDiffGlobal = 0;

    for (let match of finalValidJson.matches) {
        const statsH = match.teamStats?.home || { goals: 1.2, corners: 4.5, shots: 10.0 };
        const statsA = match.teamStats?.away || { goals: 1.2, corners: 4.5, shots: 10.0 };

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

        const homeDominance = tpiHome / (tpiHome + tpiAway);
        if (pH > 0.40 && homeDominance > 0.55) detectedGameScript = "HOME_PRESSURE";
        else if (pA > 0.40 && (1 - homeDominance) > 0.55) detectedGameScript = "AWAY_PRESSURE";
        else if (market_lt < 2.2) detectedGameScript = "LOW_TEMPO";
        else detectedGameScript = "OPEN_GAME";

        const l3 = Math.min(0.25, market_lt * 0.07);
        const l1 = Math.max(0.1, lh - l3);
        const l2 = Math.max(0.1, la - l3);

        const activeMarketsMap = new Map();
        
        // Alimentamos a engine com as escolhas reais do texto primeiro
        if (match.viablePicks) {
            for (let pick of match.viablePicks) {
                const norm = normalizeMarket(pick.market || '', match.matchName || '');
                if (!norm || !validateMarketLine(norm.type, norm.line, norm.target)) continue; 
                if (!activeMarketsMap.has(norm.hash)) activeMarketsMap.set(norm.hash, { norm, hits: 0, ref: pick });
            }
        }

        const teams = (match.matchName || '').split(/ v | vs | - /i);
        const homeTeam = teams[0] ? teams[0].trim() : 'Casa';
        const awayTeam = teams[1] ? teams[1].trim() : 'Visitante';

        // Preenche com Smart Lines APENAS se o NLP não achar mercados suficientes
        if (activeMarketsMap.size < 3) {
            let fallbackLines = ["Mais de 1.5 Gols", "Mais de 7.5 Escanteios", "Ambas Marcam Sim"];
            if (detectedGameScript === "HOME_PRESSURE") fallbackLines.push(`${homeTeam} Mais de 1.5 Gols`, `${homeTeam} Mais de 4.5 Escanteios`);
            if (detectedGameScript === "AWAY_PRESSURE") fallbackLines.push(`${awayTeam} Mais de 1.5 Gols`, `${awayTeam} Mais de 4.5 Escanteios`);
            
            for (let fl of fallbackLines) {
                const norm = normalizeMarket(fl, match.matchName || '');
                if (norm && !activeMarketsMap.has(norm.hash)) activeMarketsMap.set(norm.hash, { norm, hits: 0, ref: { market: fl, sampleSize: 10, extractedOdd: 0, confidence: 1.0 } });
            }
        }

        const activeMarkets = Array.from(activeMarketsMap.values());
        if (activeMarkets.length === 0) continue; 

        const ITERATIONS = 25000;
        let homeCornerShare = tpiHome / (tpiHome + tpiAway);

        for (let i = 0; i < ITERATIONS; i++) {
            const z_ht = poissonSample(l3 * 0.44);
            const goalsHomeHT = poissonSample(l1 * 0.44) + z_ht;
            const goalsAwayHT = poissonSample(l2 * 0.44) + z_ht;
            const totalGoalsHT = goalsHomeHT + goalsAwayHT;

            const z = poissonSample(l3);
            const goalsHome = poissonSample(l1) + z;
            const goalsAway = poissonSample(l2) + z;
            const totalGoals = goalsHome + goalsAway;

            let gameKillFactor = 1.0;
            if (Math.abs(goalsHome - goalsAway) >= 2) gameKillFactor = 0.70; 

            const baseCornerRate = (statsH.corners + statsA.corners) * 0.4;
            const shotPressure = ((statsH.shots + statsA.shots) / 20) * 0.6;
            const adjustedCornerMean = (baseCornerRate + shotPressure * market_lc) * gameKillFactor;
            
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

                let simGoals = norm.isHT ? totalGoalsHT : totalGoals;
                if (norm.target === 'home') simGoals = norm.isHT ? goalsHomeHT : goalsHome;
                if (norm.target === 'away') simGoals = norm.isHT ? goalsAwayHT : goalsAway;

                let simCorners = corners;
                if (norm.target === 'home') simCorners = cornersHome;
                if (norm.target === 'away') simCorners = cornersAway;

                if (norm.type === 'goals') isHit = norm.isOver ? (simGoals > norm.line) : (simGoals < norm.line);
                else if (norm.type === 'corners') isHit = norm.isOver ? (simCorners > norm.line) : (simCorners < norm.line);
                else if (norm.type === 'btts') isHit = norm.isHT ? (goalsHomeHT > 0 && goalsAwayHT > 0) : (goalsHome > 0 && goalsAway > 0);
                else if (norm.type === 'race') {
                    if (norm.target === 'none') {
                        if (norm.line === 3) isHit = (race3Winner === 'none');
                        if (norm.line === 5) isHit = (race5Winner === 'none');
                    } else {
                        if (norm.line === 3) isHit = (norm.target === 'home' && race3Winner === 'home') || (norm.target === 'away' && race3Winner === 'away');
                        else if (norm.line === 5) isHit = (norm.target === 'home' && race5Winner === 'home') || (norm.target === 'away' && race5Winner === 'away');
                    }
                }
                
                if (isHit) mkt.hits++;
            }
        }

        for (let mkt of activeMarkets) {
            const pick = mkt.ref;
            let rawProb = mkt.hits / ITERATIONS;
            
            let rawOdd = Number(pick.extractedOdd);
            let finalProb = rawProb;

            if (rawOdd && !isNaN(rawOdd) && rawOdd !== 1.50 && rawOdd !== 0) {
                const impliedMarketProb = 1 / rawOdd;
                finalProb = (0.70 * rawProb) + (0.30 * impliedMarketProb); 
            } else {
                rawOdd = (1 / rawProb) * 0.92; 
            }

            rawProb = Math.max(0.01, Math.min(finalProb * (finalProb > 0.85 ? 0.96 : 1), 0.98));
            const finalOdd = Math.min(Math.max(rawOdd, 1.01), 10.0);

            if (rawProb < 0.45 || rawProb > 0.95) continue; 
            if (finalOdd > 2.50 || finalOdd < 1.10) continue; 

            allProcessedLegs.push({
                match: match.matchName, market: pick.market, marketCategory: pick.marketCategory, normHash: mkt.norm.hash,
                mktType: mkt.norm.type, mktTarget: mkt.norm.target, 
                rawProb: rawProb, extractedOdd: finalOdd, confidence: 1.0, samplePenalty: 1.0 
            });
        }
    }

    // ==========================================
    // 💡 PASSO 3: CÓPULA GAUSSIANA E OTIMIZADOR
    // ==========================================
    let opportunities: any[] = [];
    
    const BUILDER_MIN = 1.55; 
    const BUILDER_MAX = 2.50; // Ampliei a margem do Builder
    const EDGE_MIN = -0.05; 

    // SINGLES 
    for (let leg of allProcessedLegs) {
        if (leg.extractedOdd < BUILDER_MIN || leg.extractedOdd > BUILDER_MAX) continue;
        const ev = (leg.rawProb * leg.extractedOdd) - 1; 
        const edge = leg.rawProb - (1 / leg.extractedOdd);
        if (edge >= EDGE_MIN) {
            const isPremiumSingle = leg.mktType === 'goals' || leg.mktType === 'corners' || leg.mktType === 'btts';
            const score = edge * entropyWeight(leg.rawProb) * (isPremiumSingle ? 1.5 : 1.0); 
            opportunities.push({ type: 'Simples', legs: [leg], prob: leg.rawProb, odd: leg.extractedOdd, ev, edge, score });
        }
    }

    // DUPLAS (Cópula ajustada para correlações extremas)
    for (let i = 0; i < allProcessedLegs.length; i++) {
        for (let j = i + 1; j < allProcessedLegs.length; j++) {
            const l1 = allProcessedLegs[i];
            const l2 = allProcessedLegs[j];
            const isSameGame = l1.match === l2.match;

            if (isSameGame) {
                if (l1.mktType === l2.mktType && l1.mktTarget === l2.mktTarget) continue;
                if (l1.mktType === 'goals' && l2.mktType === 'goals' && (l1.mktTarget === 'match' || l2.mktTarget === 'match')) continue;
                if ((l1.mktType === 'btts' && l2.mktType === 'goals') || (l2.mktType === 'btts' && l1.mktType === 'goals')) continue;
                if ((l1.mktType === 'corners' || l1.mktType === 'race') && (l2.mktType === 'corners' || l2.mktType === 'race')) continue;
            }

            let p1 = l1.rawProb; let p2 = l2.rawProb;
            let combProb = p1 * p2;

            if (isSameGame) {
                let rho = 0.05; // Base rho
                if (l1.mktTarget === l2.mktTarget && l1.mktTarget !== 'match' && l1.mktType !== l2.mktType) rho = 0.20;
                else if (l1.mktTarget !== l2.mktTarget && l1.mktType !== l2.mktType) rho = 0.10;
                
                // Aplica a Cópula de FGM, limitando a probabilidade conjunta a 96%
                combProb = (p1 * p2) + rho * Math.sqrt(p1 * (1 - p1) * p2 * (1 - p2));
            } else {
                combProb *= 0.95; // Taxa de redução para jogos separados
            }
            
            combProb = Math.max(0.01, Math.min(combProb, 0.96)); // Proteção anti-explosão
            const combOdd = l1.extractedOdd * l2.extractedOdd;
            const edge = combProb - (1 / combOdd);
            const ev = (combProb * combOdd) - 1;

            if (combOdd >= BUILDER_MIN && combOdd <= BUILDER_MAX && edge >= EDGE_MIN) {
                const score = edge * entropyWeight(combProb) * (isSameGame ? 2.5 : 1.0);
                opportunities.push({ type: `Smart Builder: ${detectedGameScript}`, legs: [l1, l2], prob: combProb, odd: combOdd, ev, edge, score });
            }
        }
    }

    // TRIPLAS (Proteção Refinada)
    for (let i = 0; i < allProcessedLegs.length; i++) {
        for (let j = i + 1; j < allProcessedLegs.length; j++) {
            for (let k = j + 1; k < allProcessedLegs.length; k++) {
                const l1 = allProcessedLegs[i]; const l2 = allProcessedLegs[j]; const l3 = allProcessedLegs[k];
                if (l1.match !== l2.match || l1.match !== l3.match) continue;

                if (l1.mktType === l2.mktType || l2.mktType === l3.mktType || l1.mktType === l3.mktType) continue;
                if ([l1, l2, l3].some(l => l.mktType === 'btts') && [l1, l2, l3].some(l => l.mktType === 'goals')) continue;

                let combProb = l1.rawProb * l2.rawProb * l3.rawProb * 1.1; // Leve boost de correlação interna
                combProb = Math.max(0.01, Math.min(combProb, 0.95)); // Proteção anti-explosão
                
                const combOdd = l1.extractedOdd * l2.extractedOdd * l3.extractedOdd;
                const edge = combProb - (1 / combOdd);

                if (combOdd >= BUILDER_MIN && combOdd <= BUILDER_MAX && edge >= EDGE_MIN) {
                    const score = edge * entropyWeight(combProb) * 3.0;
                    opportunities.push({ type: `Super Builder: ${detectedGameScript}`, legs: [l1,l2,l3], prob: combProb, odd: combOdd, ev: (combProb * combOdd) - 1, edge, score });
                }
            }
        }
    }

    // A GUILHOTINA
    const builderOps = opportunities.filter(o => o.legs.length > 1);
    if (builderOps.length > 0) opportunities = builderOps;

    const uniqueOps = new Map();
    for (let op of opportunities) {
        const opKey = op.legs.map((l:any) => l.normHash).sort().join("|");
        if (!uniqueOps.has(opKey) || uniqueOps.get(opKey).score < op.score) uniqueOps.set(opKey, op);
    }
    opportunities = Array.from(uniqueOps.values()).sort((a, b) => b.score - a.score);
    const topOpportunities = opportunities.slice(0, 3);

    if (topOpportunities.length === 0) {
        return res.status(200).json({ NO_BET: true, reason: "NO BET: O Game Script não encontrou Valor Esperado (EV+) realista no range de Odds operacional. O mercado parece bem ajustado." });
    }

    const bestOpp = topOpportunities[0];
    const finalSelections = bestOpp.legs.map((l:any) => ({
        match: l.match, market: l.market, marketCategory: l.marketCategory, prob: Math.round(l.rawProb * 100), extractedOdd: l.extractedOdd
    }));

    const combinedProb = Math.round(bestOpp.prob * 100);
    const fairOdd = Number((1 / bestOpp.prob).toFixed(2));
    const marketOdd = Number(bestOpp.odd.toFixed(2));
    const riskLabel = bestOpp.prob < 0.45 ? "ALTO" : bestOpp.prob >= 0.60 ? "BAIXO" : "MÉDIO";

    // =====================================================
    // ✍️ CAMADA 5: RELATÓRIO DO APOSTADOR (Linguagem Agressiva & PRO)
    // =====================================================
    const topPickDesc = bestOpp.legs.map((l:any) => `${l.market}`).join(" + ");
    
    // Traduz o Game Script do robô para o dialeto do trader
    let scriptTraduzido = "";
    if (detectedGameScript === "HOME_PRESSURE") scriptTraduzido = "AMASSO DO MANDANTE";
    else if (detectedGameScript === "AWAY_PRESSURE") scriptTraduzido = "AMASSO DO VISITANTE";
    else if (detectedGameScript === "LOW_TEMPO") scriptTraduzido = "JOGO TRUNCADO / CEMITÉRIO";
    else scriptTraduzido = "JOGO ABERTO (LÁ E CÁ)";

    const generatedAnalysis = `🔥 LEITURA DO MOTOR: [${scriptTraduzido}].\nEsqueça o achismo. O nosso modelo quantitativo rastreou uma linha desajustada na casa de apostas. A entrada com maior Valor Esperado (EV+) é a combinação: "${topPickDesc}".\n\n📊 A MATEMÁTICA: O cruzamento do volume de pressão com a eficiência de finalização (xG) nos mostra que a probabilidade REAL dessa aposta bater é de ${combinedProb}%. A sua Odd Justa (Fair Odd) é de @${fairOdd.toFixed(2)}. Se o mercado te oferecer qualquer coisa acima disso, é erro da casa. Pegue o valor e vamos pro Green!`;

    let generatedAlt = topOpportunities.length > 1 
        ? `💡 PLANO B (Backup de Valor): Se a odd principal derreter, monte "${topOpportunities[1].legs.map((l:any) => `${l.market}`).join(" + ")}". A Odd Justa aqui é @${topOpportunities[1].odd.toFixed(2)}. Leitura tática perfeita para pegar a sobra do mercado.`
        : "O filtro de segurança eliminou opções secundárias. O algoritmo exige foco 100% na entrada principal.";

    let generatedCons = topOpportunities.length > 2
        ? `🛡️ ROTA CONSERVADORA: Quer reduzir o risco? Vá de "${topOpportunities[2].legs.map((l:any) => `${l.market}`).join(" + ")}" (Odd Justa: @${topOpportunities[2].odd.toFixed(2)}).`
        : `⚠️ GESTÃO DE BANCA: O cenário atual exige respeito. Nível de Risco: ${riskLabel}. Não fuja da sua Stake Padrão (Flat Stake).`;

    return res.status(200).json({
        selections: finalSelections,
        combinedProb, fairOdd, marketOdd, 
        minProb: Math.max(1, combinedProb - 5), maxProb: Math.min(99, combinedProb + 5), 
        riskLevel: riskLabel, structuralRiskScore: 0,
        analysis: generatedAnalysis, alternativeCombination: generatedAlt, conservativeCombination: generatedCons
    });

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao processar o Game Script.' });
  }
}