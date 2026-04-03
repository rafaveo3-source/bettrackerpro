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
        prompt = `Atue como um Scanner HFT de Apostas. O usuário colou uma GRADE inteira de jogos ao vivo.
Sua missão é filtrar o ruído e encontrar APENAS os 3 a 5 melhores jogos com potencial de "Amasso" (Volume ofensivo alto).

REGRAS DE TEMPO:
1. IGNORE SUMARIAMENTE jogos com 88 minutos ou mais (ex: 88', 89', 90+1', FT, Fim de Jogo).
2. Jogos entre 80' e 87' SÓ podem ser recomendados para "Escanteios".
3. Recomendações de "Gols" exigem que o jogo esteja, no máximo, aos 75'-80'.

TEXTO BRUTO:
"""
${textData}
"""

Retorne ESTRITAMENTE este JSON (array de objetos):
{
  "matches": [
    {
      "time": "75'",
      "match": "Time A vs Time B",
      "score": "0-1",
      "market": "Gols ou Cantos",
      "reason": "Time A perdendo, posse alta e gerando xG."
    }
  ]
}`;
    } else {
        prompt = `Atue como um Extrator Quantitativo de Dados Ao Vivo (In-Play) para modelos HFT.
O usuário copiou a página de um único jogo (CornerPro, RoboTip, SofaScore ou Flashscore). 

TEXTO BRUTO:
"""
${textData}
"""

REGRAS DE EXTRAÇÃO DE ALTA PRECISÃO MATEMÁTICA:
1. TIMES E PLACAR: Encontre o nome dos dois times. O placar deve ser o atual EXATO (Ex: "0-0").
2. MINUTO ATUAL (min): Procure por relógios. Se "INTERVALO", retorne 45. Se "FT" ou "Encerrado", retorne 90. Ex: 66.
3. GOLS TOTAIS: Soma dos gols EXATOS do placar (Ex: 0-0 = 0).
4. CANTOS TOTAIS: REGRA DE OURO MÁXIMA! IGNORE ABSOLUTAMENTE TUDO sob a aba "Eventos Jogo" ou linhas da linha do tempo. Vá DIRETAMENTE para a tabela "Dados Jogo" ou "Estatísticas". Encontre a palavra exata "Cantos" ou "Escanteios". Você verá um número para o time da casa e um para o visitante (Ex: "2 Cantos 4"). SOME OS DOIS VALORES (Ex: 2+4=6). Retorne APENAS a SOMA TOTAL. Se não encontrar a linha da estatística principal, retorne 0. NUNCA conte palavras soltas.
5. PRESSÃO (apPress / apDef): Procure por "Ataques Perigosos" ou "Ataques P.". 'apPress' é o MAIOR número absoluto (ignorando taxas por minuto). 'apDef' é o MENOR número absoluto. 
6. LETALIDADE (sot / sofft): PARA GOLS, PRECISAMOS DO TOTAL DA PARTIDA. SOME os "Chutes no Alvo" (ou Remates baliza / Finalizações no alvo) das DUAS EQUIPES. Esse será o 'sot'. SOME os "Chutes para Fora" (Remates ao lado) das DUAS EQUIPES. Esse será o 'sofft'.
7. CONTEXTO: 
   - redCard: Se o time que ataca tomou vermelho = "pressing". Defesa = "defending". Nenhum = "none".
   - pressureTrend: "increasing", "stable" ou "decreasing".
   - matchTemperature: "intense" (jogo movimentado/aberto) ou "calm" (morno).
   - needsGoal: true se o time com MAIOR apPress está empatando ou perdendo por 1 gol de diferença.

RETORNE ESTE JSON ESTRITAMENTE:
{
  "homeTeam": "Independiente Medellín",
  "awayTeam": "Once Caldas",
  "score": "0-0",
  "min": 66,
  "totalGoals": 0,
  "totalCorners": 6,
  "apPress": 35,
  "apDef": 23,
  "sot": 1,
  "sofft": 10,
  "recentShots": 0,
  "recentCorners": 0,
  "pressureTrend": "increasing",
  "matchTemperature": "calm",
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
                throw new Error("Ambas as APIs de IA falharam.");
            }
        } else {
            throw new Error("Falha na extração de dados via IA.");
        }
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
            
            let minute = parseInt(json.min) || 0;
            if (!minute || minute < 1) minute = extractMinuteFallback(textData);
            json.min = minute < 1 ? 1 : minute;

            json.totalGoals = parseInt(json.totalGoals) || 0;
            json.totalCorners = parseInt(json.totalCorners) || 0;
            json.apPress = parseInt(json.apPress) || 0;
            json.apDef = parseInt(json.apDef) || 0;
            json.sot = parseInt(json.sot) || 0;
            
            // TRAVA FÍSICA PARA CANTOS: Se a IA disser que tem 19 cantos aos 66', ela corta na hora.
            if (json.totalCorners > (json.min * 0.4)) json.totalCorners = Math.round(json.min / 10); 
            
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