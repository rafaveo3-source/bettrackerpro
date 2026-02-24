import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'A Chave da API não está configurada na Vercel.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🔥 O SUPER PROMPT: Treinando a IA para ler a Bet365 como um profissional
    const prompt = `Você é um Analista de Dados HFT especializado em futebol.
    Analise esta imagem (um radar de estatísticas, como da Bet365 ou similar).

    TAREFAS:
    1. Localize as estatísticas do Time Mandante (geralmente esquerda/cima) e Visitante (direita/baixo).
    2. DESCUBRA QUEM ESTÁ PRESSIONANDO: Compare os "Ataques Perigosos" de ambos. O time com MAIOR número numérico é o "Time Pressionando". O time com o menor número é a "Defesa".
    3. ATENÇÃO AOS CHUTES (BET365): A Bet365 exibe finalizações no formato "Total / No Alvo" (ex: 19/6). Para o Time Pressionando:
       - SOT (No Alvo) = 6
       - SOFFT (Para Fora) = 19 - 6 = 13.
    4. Encontre o Minuto atual do jogo e a Soma Total de Escanteios (ou Gols).

    REGRAS DE RETORNO:
    - Retorne APENAS um JSON válido. Sem markdown (\`\`\`json).
    - Se um valor NÃO estiver visível no print (por exemplo, a foto não mostra o minuto ou os escanteios), retorne OBRIGATORIAMENTE a string vazia "". Não invente números e não retorne 0 se não tiver certeza.

    Formato exato de saída:
    {
      "min": "Minuto atual numérico ou \"\"",
      "target": "Soma total de escanteios (ou gols) de ambos os times ou \"\"",
      "apPress": "Ataques Perigosos do Time Pressionando ou \"\"",
      "apDef": "Ataques Perigosos do Time Defendendo ou \"\"",
      "sot": "Chutes NO ALVO numérico do Time Pressionando ou \"\"",
      "sofft": "Chutes FORA numérico do Time Pressionando ou \"\""
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: mimeType || 'image/png' } }
    ]);

    let responseText = result.response.text();
    console.log("Resposta Bruta IA:", responseText);

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
    return res.status(500).json({ error: 'Erro ao processar a imagem. Preencha manualmente.' });
  }
}