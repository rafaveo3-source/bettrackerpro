import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Você é um Algoritmo Precificador (Bookmaker) Pré-Live.
    Analise a imagem contendo estatísticas pré-jogo de uma partida (SofaScore, Flashscore).
    Baseado no histórico visualizado (médias de gols, histórico de cantos, retrospecto H2H), construa a melhor combinação (Aposta Dupla - Bet Builder) possível.

    A combinação DEVE ter:
    - 1 seleção de Gols (ex: Mais de 1.5 Gols ou Mais de 0.5 Gols HT)
    - 1 seleção de Escanteios (ex: Mais de 7.5 Escanteios ou Mais de 8.5 Escanteios)
    - O alvo final é uma probabilidade combinada (prob1 * prob2) realista que resulte em uma Odd Média entre 1.60 e 2.00.

    Retorne APENAS um JSON válido neste formato exato (sem markdown):
    {
      "selection1": "Descrição do Mercado 1 (ex: Mais de 1.5 Gols)",
      "prob1": probabilidade do mercado 1 em numero (ex: 82),
      "selection2": "Descrição do Mercado 2 (ex: Mais de 7.5 Cantos)",
      "prob2": probabilidade do mercado 2 em numero (ex: 78),
      "analysis": "Sua tese quantitativa do porquê esses mercados conversam entre si baseada na foto lida."
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
    
    // Calcula a probabilidade combinada e a Fair Odd no backend para entregar pronto
    const p1 = (json.prob1 || 70) / 100;
    const p2 = (json.prob2 || 70) / 100;
    json.combinedProb = Math.round(p1 * p2 * 100);
    json.fairOdd = Number((1 / (p1 * p2)).toFixed(2));

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(500).json({ error: 'Erro ao construir a aposta.' });
  }
}