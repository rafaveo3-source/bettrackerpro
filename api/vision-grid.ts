import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType, email } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(400).json({ error: 'Autenticação inválida. E-mail ausente.' });

    const isAdmin = email === adminEmail;

    if (!isAdmin) {
        // 🔴 FUTURA INTEGRAÇÃO COM BANCO DE DADOS AQUI
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🔥 TRAVA DE QUANTIDADE REMOVIDA & TEMPO ADICIONADO
    const prompt = `Você é um Analista de Scout Pré-Live Esportivo HFT.
    Sua missão é olhar para esta imagem contendo uma lista de jogos e odds 1x2 e extrair oportunidades claras de valor (EV+).

    REGRAS TÁTICAS DE FILTRAGEM:
    1. GOLS (Over): Procure jogos com um claro Super Favorito (Odd 1x2 do mandante ou visitante abaixo de 1.45) ou ligas com forte tendência de ataque.
    2. CANTOS: Procure jogos extremamente equilibrados (Odds do tipo 2.50 vs 2.70), indicando que os times vão brigar pelo controle do jogo, forçando jogadas de linha de fundo.
    3. Descarte: Jogos com odds parelhas em ligas truncadas ou onde os nomes dos times não indiquem volume de jogo.

    Mapeie TODOS os jogos visíveis na imagem que apresentem real valor estatístico (seja rigoroso, mostre apenas os muito bons).
    Retorne APENAS um JSON válido neste formato exato (não use markdown \`\`\`json):
    {
      "matches": [
        {
          "time": "Horário do jogo (ex: 19:00 ou 16:30)",
          "teams": "Nome Time A vs Nome Time B",
          "market": "GOLS" ou "CANTOS",
          "reason": "Explicação técnica curta do porquê a odd assinala valor estatístico."
        }
      ]
    }`;

    const result = await model.generateContent([ prompt, { inlineData: { data: image, mimeType: mimeType || 'image/png' } } ]);

    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const start = responseText.indexOf('{'); const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1) responseText = responseText.substring(start, end + 1);

    const json = JSON.parse(responseText);

    if (!isAdmin) {
       // 🔴 AQUI VOCÊ SOMA +1 NO BANCO DE DADOS DO USUÁRIO
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Grid:", error);
    return res.status(500).json({ error: 'Erro ao mapear a grade de jogos.' });
  }
}