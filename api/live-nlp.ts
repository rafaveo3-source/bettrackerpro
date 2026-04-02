import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { textData, email } = req.body;
    
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente.' });
    if (!textData || textData.trim().length < 20) return res.status(400).json({ error: 'Texto insuficiente.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    });

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    const prompt = `Atue como um Extrator Quantitativo de Dados Ao Vivo (In-Play) para modelos HFT de apostas.
O usuário copiou e colou a página de um site de estatísticas (SofaScore, Flashscore, CornerPro, etc.). 
Extraia a radiografia global da partida para o motor matemático calcular oportunidades de GOLS e ESCANTEIOS simultaneamente.

TEXTO BRUTO:
"""
${textData}
"""

REGRAS DE EXTRAÇÃO:
1. MINUTO ATUAL (min): Retorne apenas o número (Ex: 78).
2. GOLS TOTAIS (totalGoals): Soma dos gols das duas equipes. Se não achar, assuma 0.
3. CANTOS TOTAIS (totalCorners): Soma dos escanteios das duas equipes. Se não achar, assuma 0.
4. PRESSÃO (apPress / apDef): Identifique os "Ataques Perigosos". 'apPress' é o MAIOR número (time que está atacando). 'apDef' é o MENOR número.
5. LETALIDADE (sot / sofft): Pegue os "Chutes no Alvo" (sot) e "Chutes para Fora" (sofft) APENAS do time que tem o MAIOR apPress.
6. CONTEXTO: 
   - redCard: Se o time que ataca tomou vermelho ("pressing"), se o que defende tomou ("defending"), ou "none".
   - pressureTrend: "increasing" (crescendo), "stable" (estável) ou "decreasing" (caindo).
   - matchTemperature: "intense" (jogo pegado) ou "calm" (morno).
   - needsGoal: true se o time que está amassando (apPress) está empatando ou perdendo por 1 gol nos minutos finais.

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

    let textResult = "";
    
    try {
        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
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

        // Fallbacks de segurança
        if (!json.redCard || !["none", "pressing", "defending"].includes(json.redCard)) json.redCard = "none";
        if (!json.pressureTrend || !["increasing", "stable", "decreasing"].includes(json.pressureTrend)) json.pressureTrend = "stable";
        if (!json.matchTemperature || !["intense", "calm"].includes(json.matchTemperature)) json.matchTemperature = "calm";
        if (json.min === undefined || json.min === null) json.min = 0;

        return res.status(200).json(json);

    } catch(e) {
        throw new Error("Não foi possível extrair dados estatísticos do texto.");
    }

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao processar dados In-Play.' });
  }
}