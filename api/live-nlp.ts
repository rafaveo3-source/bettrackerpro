import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { textData, mode, scenario, email } = req.body;
    
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente.' });
    if (!textData || textData.trim().length < 20) return res.status(400).json({ error: 'Texto insuficiente.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    // Usando Flash para velocidade máxima em NLP
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    });

    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    const marketFocus = mode === 'exc' ? 'ESCANTES (CANTOS)' : 'GOLS';
    const scenarioInfo = scenario ? `Cenário do usuário: ${scenario}` : '';

    const prompt = `Atue como um Extrator Quantitativo de Dados Ao Vivo (In-Play) para modelos HFT (High-Frequency Trading) de apostas esportivas.
O usuário copiou e colou a página de um site de estatísticas de futebol (Flashscore, SofaScore, CornerPro, etc.). 
O texto está uma bagunça, mas contém os dados vitais da partida EM TEMPO REAL.

FOCO DA EXTRAÇÃO: ${marketFocus}
${scenarioInfo}

TEXTO BRUTO:
"""
${textData}
"""

=====================================================
OBJETIVO E REGRAS DE EXTRAÇÃO:
=====================================================
1. MINUTO ATUAL (min): Procure relógios, minutos de jogo (Ex: 78', 85:00, 45+2). Retorne apenas o número base (Ex: 78).
2. TARGET (Gols ou Cantos): Se o foco for CANTOS, some os escanteios de ambas as equipes (ou do favorito se estiver claro). Se o foco for GOLS, some os gols.
3. AP PRESS (Ataques Perigosos do time atacando): Identifique a linha de "Ataques Perigosos" ou "Dangerous Attacks". O "apPress" é o MAIOR número entre os dois times (quem está amassando).
4. AP DEF (Ataques Perigosos do time defendendo): É o MENOR número da mesma linha.
5. CHUTES NO ALVO (sot) E PARA FORA (sofft): Pegue os chutes APENAS do time que tem o MAIOR número de Ataques Perigosos (o time que está atacando).
6. CARTÃO VERMELHO (redCard): Procure menções a cartões vermelhos. Se o time que ataca tomou, retorne "pressing". Se o time que defende tomou, "defending". Se não achar nada, "none".
7. TEMPERATURA E TENDÊNCIA: Baseado no volume de chutes e ataques por minuto, deduza se o jogo está "intense" ou "calm", e se a pressão está "increasing", "stable" ou "decreasing".

RETORNE ESTE JSON ESTRITAMENTE:
{
  "min": 75,
  "target": 8,
  "apPress": 65,
  "apDef": 25,
  "sot": 5,
  "sofft": 4,
  "recentShots": 2,
  "recentCorners": 1,
  "pressureTrend": "increasing",
  "matchTemperature": "intense",
  "redCard": "none",
  "recentGoal": false,
  "needsGoal": true
}`;

    let textResult = "";
    
    try {
        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        textResult = result.response.text();
    } catch (geminiError: any) { 
        console.warn("Gemini NLP Falhou no In-Play. Tentando OpenAI...", geminiError.message);
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
                throw new Error("Ambas as IAs falharam na extração In-Play.");
            }
        } else {
            throw new Error("Erro na IA (Gemini) e sem backup OpenAI.");
        }
    }

    try {
        textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
        const jsonMatch = textResult.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) textResult = jsonMatch[0];
        
        const json = JSON.parse(textResult);

        // 🛡️ BLINDAGEM DE SAÍDA
        if (!json.redCard || !["none", "pressing", "defending"].includes(json.redCard)) json.redCard = "none";
        if (!json.pressureTrend || !["increasing", "stable", "decreasing"].includes(json.pressureTrend)) json.pressureTrend = "stable";
        if (!json.matchTemperature || !["intense", "calm"].includes(json.matchTemperature)) json.matchTemperature = "calm";
        if (json.min === undefined || json.min === null) json.min = 0;

        return res.status(200).json(json);

    } catch(e) {
        throw new Error("O texto colado não possuía dados estatísticos legíveis.");
    }

  } catch (error: any) {
    console.error("Erro Live NLP AI:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar dados In-Play.' });
  }
}