import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email } = req.body; // Agora recebe um array de imagens
    
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

    const prompt = `Você é um Algoritmo Precificador (Bookmaker) Pré-Live.
    Você receberá uma ou mais imagens contendo estatísticas pré-jogo (SofaScore, Flashscore).
    
    ESTRATÉGIA:
    - Se houver apenas 1 jogo nas imagens: Crie uma aposta combinada (Bet Builder) para aquele mesmo jogo (1 de Gols + 1 de Cantos).
    - Se houver estatísticas de 2 ou mais jogos DIFERENTES nas imagens: Crie uma APOSTA DUPLA CRUZADA (Múltipla). Pegue a previsão mais forte (a mais provável) do Jogo 1 e cruze com a previsão mais forte do Jogo 2. Exemplo: Jogo A (Mais de 1.5 Gols) + Jogo B (Mais de 7.5 Cantos).

    O alvo final é uma probabilidade combinada (prob1 * prob2) realista que resulte em uma Odd Média entre 1.50 e 2.00.

    Retorne APENAS um JSON válido neste formato exato (sem markdown):
    {
      "selection1": "Descrição da Aposta 1 [Nome do Jogo ou Mercado] (ex: Arsenal vs Milan - Mais de 1.5 Gols)",
      "prob1": probabilidade do mercado 1 em numero inteiro (ex: 82),
      "selection2": "Descrição da Aposta 2 [Nome do Jogo ou Mercado] (ex: Chelsea vs Porto - Mais de 7.5 Cantos)",
      "prob2": probabilidade do mercado 2 em numero inteiro (ex: 78),
      "analysis": "Sua tese quantitativa cruzada do porquê essa dupla tem altíssimo valor."
    }`;

    // Monta o array de dados inline para o Gemini (suporta múltiplas imagens de uma vez)
    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const start = responseText.indexOf('{'); const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1) responseText = responseText.substring(start, end + 1);

    const json = JSON.parse(responseText);
    
    // Cálculo de Odd Justa
    const p1 = (json.prob1 || 70) / 100;
    const p2 = (json.prob2 || 70) / 100;
    json.combinedProb = Math.round(p1 * p2 * 100);
    json.fairOdd = Number((1 / (p1 * p2)).toFixed(2));

    if (!isAdmin) {
       // 🔴 AQUI VOCÊ SOMA +1 NO BANCO DE DADOS DO USUÁRIO
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(500).json({ error: 'Erro ao construir a aposta.' });
  }
}