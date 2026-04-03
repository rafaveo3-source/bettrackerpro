import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

// 🔥 CORREÇÃO PROFISSIONAL (ANTI-FALHA DE MINUTO)
const extractMinuteFallback = (text: string) => {
    if (!text) return 0;
    
    let match = text.match(/(\d{1,2})\s*'/);
    if (match) return parseInt(match[1]);
  
    match = text.match(/(\d{1,2})\s*(min|minuto)/i);
    if (match) return parseInt(match[1]);
  
    if (/intervalo|half\s*time|ht/i.test(text)) return 45;
    if (/ft|encerrado|finalizado/i.test(text)) return 90;
  
    return 0;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { textData, email, mode } = req.body; 
    
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente.' });
    if (!textData || textData.trim().length < 20) return res.status(400).json({ error: 'Texto insuficiente.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const aiModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    });

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    let prompt = "";

    if (mode === 'grid') {
        prompt = `Atue como um Scanner HFT de Apostas. Filtre a GRADE de jogos ao vivo.
REGRAS: 1. Ignore jogos com 88'+. 2. 80'-87' só cantos. 3. Gols máx 75'.
Retorne JSON: { "matches": [{ "time": "75'", "match": "A vs B", "score": "0-1", "market": "Gols/Cantos", "reason": "..." }] }
TEXTO: """${textData}"""`;
    } else {
        prompt = `Atue como Extrator Quantitativo In-Play. 
REGRAS:
1. TIMES/PLACAR: Nome e placar exato (Ex: "0-0").
2. MINUTO (min): Apenas número. HT=45, FT=90.
3. GOLS TOTAIS: Soma do placar.
4. CANTOS TOTAIS: Vá APENAS na tabela de "Estatísticas". Localize "Cantos" (Ex: "3 Cantos 4"). Some (7). NUNCA some da timeline.
5. PRESSÃO: "Ataques Perigosos". 'apPress'=MAIOR número. 'apDef'=MENOR.
6. LETALIDADE: 'sot'=Chutes no Alvo das DUAS EQUIPES somados. 'sofft'=Chutes pra fora totais.
7. CONTEXTO: redCard ("pressing"/"defending"/"none"), pressureTrend ("increasing"/"stable"/"decreasing"), matchTemperature ("intense"/"calm"), needsGoal (true/false se apPress está empatando/perdendo).
RETORNE JSON: { "homeTeam": "A", "awayTeam": "B", "score": "0-0", "min": 38, "totalGoals": 0, "totalCorners": 4, "apPress": 19, "apDef": 15, "sot": 1, "sofft": 1, "pressureTrend": "increasing", "matchTemperature": "intense", "redCard": "none", "needsGoal": true }
TEXTO: """${textData}"""`;
    }

    let textResult = "";
    
    try {
        const result = await aiModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        textResult = result.response.text();
    } catch (geminiError: any) { 
        if (openai) {
            try {
                const response = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], temperature: 0.1, response_format: { type: "json_object" } });
                textResult = response.choices[0].message?.content || "";
            } catch (openaiError: any) { throw new Error("Ambas as APIs de IA falharam."); }
        } else { throw new Error("Falha na extração via IA."); }
    }

    try {
        textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = textResult.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) textResult = jsonMatch[0];
        
        const json = JSON.parse(textResult);

        if (mode !== 'grid') {
            json.homeTeam = json.homeTeam || "Casa";
            json.awayTeam = json.awayTeam || "Fora";
            json.score = json.score || "-";
            
            // 🔥 APLICAÇÃO DO FALLBACK DE MINUTO
            let minute = parseInt(json.min) || 0;
            if (!minute || minute < 1) {
                minute = extractMinuteFallback(textData);
            }
            json.min = minute < 1 ? 1 : minute;

            json.totalGoals = parseInt(json.totalGoals) || 0;
            json.totalCorners = parseInt(json.totalCorners) || 0;
            json.apPress = parseInt(json.apPress) || 0;
            json.apDef = parseInt(json.apDef) || 0;
            json.sot = parseInt(json.sot) || 0;
            
            if (json.totalCorners > (json.min * 0.8)) json.totalCorners = Math.round(json.min / 10); 
            
            json.redCard = ["pressing", "defending"].includes(json.redCard) ? json.redCard : "none";
            json.pressureTrend = ["increasing", "stable", "decreasing"].includes(json.pressureTrend) ? json.pressureTrend : "stable";
            json.matchTemperature = ["intense", "calm"].includes(json.matchTemperature) ? json.matchTemperature : "calm";
        }

        return res.status(200).json(json);

    } catch(e) {
        throw new Error("Não foi possível extrair estatísticas viáveis deste texto.");
    }

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao processar dados In-Play.' });
  }
}