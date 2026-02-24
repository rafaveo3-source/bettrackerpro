import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'A Chave da API não está configurada.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🔥 O SUPER PROMPT DE EXTRAÇÃO DE RADAR BET365
    const prompt = `Você é um Analista Quantitativo HFT de futebol. 
    Sua missão é extrair dados EXATOS de uma imagem de radar de apostas esportivas (como a Bet365).
    
    REGRAS DE EXTRAÇÃO:
    1. GOLS (PLACAR): Olhe para o TOPO CENTRO da imagem. Geralmente são dois grandes números amarelos ou brancos (ex: 0 0, 1 2). Sume os dois números. Este é o valor de "goals".
    2. ESCANTEIOS (CANTOS): Procure pelo ícone de bandeirinha. Se houver, some os números ao lado delas. Se não estiver visível, retorne "".
    3. TIME PRESSIONANDO: Encontre a métrica "Ataques Perigosos" (frequentemente com ícone de chamas ou setas duplas). O time com o MAIOR número é o "Pressionando" (apPress). O menor é a Defesa (apDef).
    4. CHUTES: A Bet365 mostra "Finalizações / Chutes ao Gol" no formato "Total/No Alvo" (exemplo: 11/2). 
       Para o Time Pressionando:
       - SOT (No Alvo) = o número DEPOIS da barra (ex: 2).
       - SOFFT (Para Fora) = Total - No Alvo (ex: 11 - 2 = 9).
    5. MINUTO: Encontre o relógio do jogo.
    
    Retorne OBRIGATORIAMENTE um JSON válido. Se a informação não existir na imagem, retorne string vazia "". Não use markdown (\`\`\`json).
    
    {
      "min": "minuto numérico ou \"\"",
      "goals": "soma dos gols do placar ou \"\"",
      "corners": "soma dos escanteios totais ou \"\"",
      "apPress": "ataques perigosos do time pressionando ou \"\"",
      "apDef": "ataques perigosos do time defendendo ou \"\"",
      "sot": "chutes NO ALVO numérico do time pressionando ou \"\"",
      "sofft": "chutes PARA FORA numérico do time pressionando ou \"\""
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: mimeType || 'image/png' } }
    ]);

    let responseText = result.response.text();
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