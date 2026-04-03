import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

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

REGRAS DE EXTRAÇÃO DE ALTA PRECISÃO:
1. TIMES E PLACAR: Encontre o nome dos dois times. O placar deve ser extraído (Ex: "1-0").
2. MINUTO ATUAL (min): Procure por relógios. Se ler "INTERVALO" ou "HT", retorne 45. Se ler "FT", "Encerrado" ou "Finalizado", retorne 90. Ex: 38.
3. GOLS TOTAIS: Soma dos gols EXATOS do placar (Ex: 1-1 = 2).
4. CANTOS TOTAIS: REGRA DE OURO! NUNCA some números de uma timeline de eventos (como "9 Canto", "16 Canto", "30 Canto"). Isso causará falha grave. Você DEVE procurar APENAS a linha de Estatísticas/Dados do Jogo que diz "Escanteios" ou "Cantos" (Ex: "6 Escanteios 3" ou "1 Cantos 3"). Some os valores (6+3=9). Se não encontrar essa linha exata de total, retorne 0.
5. PRESSÃO (apPress / apDef): Procure por "Ataques Perigosos" ou "Ataques P.". 'apPress' é o MAIOR número absoluto (ignorando taxas por minuto). 'apDef' é o MENOR número. Se não achar "Ataques Perigosos", use "Ataques".
6. LETALIDADE (sot / sofft): Pegue "Chutes no Alvo" / "Finalizações no alvo" (sot) e "Chutes para fora" / "Finalizações para fora" (sofft) APENAS do time que tem o MAIOR apPress.
7. CONTEXTO: 
   - redCard: Se o time atacante (maior apPress) tomou vermelho = "pressing". Defesa = "defending". Nenhum = "none".
   - pressureTrend: "increasing", "stable" ou "decreasing".
   - matchTemperature: "intense" (jogo movimentado/aberto) ou "calm" (morno).
   - needsGoal: true se o time com MAIOR apPress está empatando ou perdendo por 1 gol de diferença.

RETORNE ESTE JSON ESTRITAMENTE:
{
  "homeTeam": "Talleres Córdoba",
  "awayTeam": "Boca Juniors",
  "score": "0-0",
  "min": 38,
  "totalGoals": 0,
  "totalCorners": 4,
  "apPress": 19,
  "apDef": 15,
  "sot": 1,
  "sofft": 1,
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
            json.min = parseInt(json.min) || 0;
            json.totalGoals = parseInt(json.totalGoals) || 0;
            json.totalCorners = parseInt(json.totalCorners) || 0;
            json.apPress = parseInt(json.apPress) || 0;
            json.apDef = parseInt(json.apDef) || 0;
            
            // TRAVA DE SANIDADE PARA CANTOS: É impossível ter mais cantos que o minuto atual (Ex: 40 cantos aos 30 min)
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