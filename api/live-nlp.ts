import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { textData, email, mode } = req.body; // mode: 'grid' ou 'single'
    
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

    // ==========================================
    // CÉREBRO 1: RADAR DE GRADE (MINERADOR DE OURO)
    // ==========================================
    if (mode === 'grid') {
        prompt = `Atue como um Scanner HFT de Apostas. O usuário colou uma GRADE inteira de jogos ao vivo (SofaScore, CornerPro, etc.).
Sua missão é filtrar o ruído e encontrar APENAS os 3 a 5 melhores jogos com potencial de "Amasso" (Volume ofensivo alto, muitos ataques, chutes, ou times precisando do resultado no fim).

TEXTO BRUTO:
"""
${textData}
"""

Retorne ESTRITAMENTE este JSON (um array de objetos):
{
  "matches": [
    {
      "time": "75'",
      "match": "Time A vs Time B",
      "score": "0-1",
      "market": "Gols ou Cantos",
      "reason": "Time A com muita posse, perdendo em casa e gerando muitos ataques por minuto."
    }
  ]
}`;
    } 
    // ==========================================
    // CÉREBRO 2: RAIO-X IN-PLAY (JOGO ÚNICO)
    // ==========================================
    else {
        prompt = `Atue como um Extrator Quantitativo de Dados Ao Vivo (In-Play) para modelos HFT.
O usuário copiou a página de um único jogo (SofaScore, Flashscore, CornerPro). 
Extraia a radiografia global da partida para o motor calcular oportunidades de GOLS e ESCANTEIOS.

TEXTO BRUTO:
"""
${textData}
"""

REGRAS:
1. MINUTO ATUAL (min): Retorne apenas o número (Ex: 78).
2. GOLS TOTAIS (totalGoals): Soma dos gols. Assuma 0 se não achar.
3. CANTOS TOTAIS (totalCorners): Soma dos escanteios. Assuma 0 se não achar.
4. PRESSÃO (apPress / apDef): "Ataques Perigosos". 'apPress' é o MAIOR número. 'apDef' é o MENOR.
5. LETALIDADE (sot / sofft): Pegue os "Chutes no Alvo" (sot) e "Chutes para Fora" (sofft) APENAS do time que tem o MAIOR apPress.
6. CONTEXTO: 
   - redCard: "pressing" (time que ataca tomou), "defending" (time que defende tomou) ou "none".
   - pressureTrend: "increasing", "stable" ou "decreasing".
   - matchTemperature: "intense" ou "calm".
   - needsGoal: true se o time com MAIOR apPress está empatando/perdendo nos 15 min finais.

RETORNE ESTE JSON ESTRITAMENTE:
{
  "min": 75,
  "totalGoals": 1,
  "totalCorners": 8,
  "apPress": 65,
  "apDef": 25,
  "sot": 5,
  "sofft": 4,
  "recentShots": 2,
  "recentCorners": 1,
  "pressureTrend": "increasing",
  "matchTemperature": "intense",
  "redCard": "none",
  "needsGoal": true
}`;
    }

    let textResult = "";
    
    try {
        const result = await aiModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        textResult = result.response.text();
    } catch (geminiError: any) { 
        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                });
                textResult = response.choices[0].message?.content || "";
            } catch (openaiError: any) {
                throw new Error("Ambas as IAs falharam.");
            }
        } else {
            throw new Error("Erro na IA (Gemini).");
        }
    }

    try {
        textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = textResult.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) textResult = jsonMatch[0];
        
        const json = JSON.parse(textResult);

        // Ajustes de segurança para o modo Single
        if (mode !== 'grid') {
            if (!json.redCard || !["none", "pressing", "defending"].includes(json.redCard)) json.redCard = "none";
            if (!json.pressureTrend || !["increasing", "stable", "decreasing"].includes(json.pressureTrend)) json.pressureTrend = "stable";
            if (!json.matchTemperature || !["intense", "calm"].includes(json.matchTemperature)) json.matchTemperature = "calm";
            if (json.min === undefined || json.min === null) json.min = 0;
        }

        return res.status(200).json(json);

    } catch(e) {
        throw new Error("Não foi possível extrair dados estatísticos do texto.");
    }

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao processar dados In-Play.' });
  }
}