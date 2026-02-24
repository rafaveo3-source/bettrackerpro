import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  // 1. Bloqueia se não for POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType } = req.body;
    
    // 2. Valida a Chave da API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("ERRO CRÍTICO: GEMINI_API_KEY não foi encontrada nas variáveis de ambiente da Vercel.");
        return res.status(500).json({ error: 'A Chave da API (GEMINI_API_KEY) não está configurada na Vercel. Faça um Redeploy.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 3. O Prompt Mestre HFT
    const prompt = `Você é um leitor de dados de radar de futebol (ex: Bet365). 
    Analise esta imagem e extraia APENAS os valores numéricos. 
    Retorne ESTRITAMENTE um objeto JSON válido. Sem formatação markdown, sem crases, sem texto adicional.
    Formato obrigatório:
    {
      "min": (minuto atual do jogo),
      "target": (cantos totais atuais OU gols totais atuais),
      "apDef": (ataques perigosos do time que tem menos),
      "apPress": (ataques perigosos do time que tem mais),
      "sot": (chutes no alvo totais da partida),
      "sofft": (chutes fora totais da partida)
    }`;

    // 4. Envia para a IA identificando se é PNG, JPEG, etc.
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: mimeType || 'image/png' } }
    ]);

    let responseText = result.response.text();
    console.log("Resposta Bruta IA:", responseText);

    // 5. Limpeza agressiva para garantir que o JSON não quebre o sistema
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const startIndex = responseText.indexOf('{');
    const endIndex = responseText.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
        responseText = responseText.substring(startIndex, endIndex + 1);
    }

    const json = JSON.parse(responseText);
    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro no Backend Vision AI:", error.message || error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar a imagem na IA.' });
  }
}