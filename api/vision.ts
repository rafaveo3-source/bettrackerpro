import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🔥 O SUPER PROMPT: PARSER SEMÂNTICO HFT MULTI-SOURCE
    const prompt = `Você é um Analista Quantitativo HFT de futebol. 
    Analise esta imagem de estatísticas ao vivo (Bet365, SofaScore, Flashscore, etc).
    Extraia as métricas numéricas e classifique o contexto tático/comportamental do jogo visível nos gráficos de pressão, heatmaps ou timelines.

    REGRAS DE CLASSIFICAÇÃO CONTEXTUAL:
    - pressureTrend: Se o gráfico de barras/linha do time pressionando estiver subindo no final, retorne "increasing". Se reto, "stable". Se caindo, "decreasing".
    - matchTemperature: Se houver muitos chutes recentes, cartões ou ataques altos de ambos, retorne "intense". Se parado, "calm".
    - redCard: Se o time que ataca mais tem vermelho, retorne "pressing". Se a defesa tem, "defending". Senão, "none".
    - recentGoal: Se o placar mudou nos últimos minutos visíveis na timeline, true. Senão, false.
    - needsGoal: Assuma true se houver claro domínio territorial no fim do jogo (fase de abafa).

    MÉTRICAS NUMÉRICAS (Sempre identifique quem Pressiona vs quem Defende pelos Ataques Perigosos/Posse):
    - Se não houver dados de últimos 10 min explícitos, deduza pelo gráfico ou retorne "".

    Retorne ESTRITAMENTE este JSON (se não achar a info, retorne "" ou false/none):
    {
      "min": "minuto atual do jogo",
      "target": "gols somados ou cantos totais",
      "apPress": "ataques perigosos totais do time atacando",
      "apDef": "ataques perigosos totais do time defendendo",
      "sot": "chutes no alvo totais do time atacando",
      "sofft": "chutes para fora totais do time atacando",
      "recentShots": "estimativa de chutes nos últimos 10 min",
      "recentCorners": "estimativa de cantos nos últimos 10 min",
      "pressureTrend": "increasing | stable | decreasing",
      "matchTemperature": "intense | calm",
      "redCard": "none | pressing | defending",
      "recentGoal": true/false,
      "needsGoal": true/false
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: mimeType || 'image/png' } }
    ]);

    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1) responseText = responseText.substring(start, end + 1);

    const json = JSON.parse(responseText);
    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision AI:", error);
    return res.status(500).json({ error: 'Erro ao analisar contexto visual.' });
  }
}