import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Você é um Analista de Scout Pré-Live Esportivo HFT.
    Sua missão é olhar para esta imagem contendo uma lista de jogos e odds 1x2 e extrair oportunidades claras de valor (EV+).

    REGRAS TÁTICAS DE FILTRAGEM:
    1. GOLS (Over): Procure jogos com um claro Super Favorito (Odd 1x2 do mandante ou visitante abaixo de 1.45) ou ligas com forte tendência de ataque.
    2. CANTOS: Procure jogos extremamente equilibrados (Odds do tipo 2.50 vs 2.70), indicando que os times vão brigar pelo controle do jogo, forçando jogadas de linha de fundo.
    3. Descarte: Jogos com odds parelhas em ligas truncadas ou onde os nomes dos times não indiquem volume de jogo.

    Retorne até 3 melhores jogos mapeados.
    Retorne APENAS um JSON válido neste formato exato (não use markdown \`\`\`json):
    {
      "matches": [
        {
          "teams": "Nome Time A vs Nome Time B",
          "market": "GOLS" ou "CANTOS",
          "reason": "Explicação técnica curta do porquê a odd assinala valor estatístico."
        }
      ]
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
    console.error("Erro Vision Grid:", error);
    return res.status(500).json({ error: 'Erro ao mapear a grade de jogos.' });
  }
}