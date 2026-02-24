import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  // Apenas requisições POST são permitidas
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image } = req.body;
    
    // Pega a chave da Vercel Environments
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key não configurada");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // O Prompt Mestre de Extração HFT
    const prompt = `Você é um leitor de dados de radar de futebol (ex: Bet365). 
    Analise esta imagem e extraia os valores. Retorne APENAS um objeto JSON limpo e exato. Sem markdown, sem aspas e sem texto adicional. 
    Se não encontrar um número, retorne 0 no campo dele.
    Formato esperado:
    {
      "min": (número inteiro do minuto do jogo),
      "target": (soma de cantos se for um placar de escanteios, ou soma de gols se for placar de gols),
      "apDef": (número de ataques perigosos do time que tem a menor quantidade. Ataque perigoso geralmente tem ícone de chamas ou setas duplas),
      "apPress": (número de ataques perigosos do time que tem a maior quantidade),
      "sot": (soma dos chutes NO ALVO de ambos os times),
      "sofft": (soma dos chutes FORA do alvo de ambos os times)
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: 'image/jpeg' } }
    ]);

    // Limpa a resposta da IA para garantir que seja um JSON válido
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const json = JSON.parse(responseText);
    res.status(200).json(json);

  } catch (error) {
    console.error("Erro no Vision AI:", error);
    res.status(500).json({ error: 'Erro ao processar imagem na IA' });
  }
}