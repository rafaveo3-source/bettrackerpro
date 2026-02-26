import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email, markets } = req.body; 
    
    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(400).json({ error: 'Autenticação inválida. E-mail ausente.' });

    // 🛡️ GATEKEEPER DE SEGURANÇA
    const isAdmin = email === adminEmail;
    if (!isAdmin) {
        // 🔴 FUTURA INTEGRAÇÃO COM BANCO DE DADOS AQUI
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'GOLS, ESCANTEIOS, RESULTADO';

    // 🔥 SUPER PROMPT V3 (MATEMÁTICA AVANÇADA, ANTI-ALUCINAÇÃO E MARGEM DE SEGURANÇA)
    const prompt = `Você é um Analista Quantitativo HFT e Algoritmo Precificador Pré-Live Especialista em Apostas Combinadas.
    Você receberá imagens contendo estatísticas pré-jogo (SofaScore, Flashscore, CornerPro).
    
    ⚠️ REGRA DE OURO - ANTI-ALUCINAÇÃO EM PLACARES AGREGADOS:
    Leia estritamente o que está na tela. Ao analisar jogos de "1ª Mão" ou "2ª Mão" (mata-mata), verifique QUEM ganhou a primeira partida no histórico de confrontos diretos antes de dizer quem está em desvantagem. Não invente desvantagens.

    🧠 INTELIGÊNCIA MATEMÁTICA OBRIGATÓRIA:
    Não se deixe levar apenas pela cor visual do gráfico. Aplique raciocínio quantitativo:
    1. Calcule a média real de gols e cantos somando os últimos jogos divididos pelo número de partidas.
    2. Considere o "Desvio Padrão": Se um time fez 5 gols num jogo e 0 nos outros quatro, a média é mentirosa. Busque CONSTÂNCIA (Taxa de Acerto / Hit Rate).
    3. Analise o "Field Tilt" (áreas de ação): Se um time tem mais de 60% de ação no terço final, priorize mercados ofensivos.

    🎯 MERCADOS PERMITIDOS (FOCO DO USUÁRIO):
    O usuário solicitou que você explore APENAS combinações dentro destes mercados: [ ${selectedMarketsStr} ]. 
    Formate cada seleção no padrão: "[Escopo] ([Tempo]) - [Mercado]" (Ex: "Partida (FT) - Mais de 1.5 Gols").

    Sua saída deve conter:
    1. A Múltipla Principal (Odd combinada ideal entre 1.50 e 2.00).
    2. Uma Combinação Alternativa (Caso a principal não agrade o usuário).
    3. Uma "Margem de Segurança" (A versão mais conservadora da sua aposta principal, para alavancagem segura).

    Retorne APENAS um JSON válido neste formato exato (sem markdown):
    {
      "selections": [
        {
          "match": "Nome do Jogo",
          "market": "Mercado Escolhido",
          "prob": 85
        }
      ],
      "alternativeCombination": "Explique uma entrada alternativa. Ex: Em vez de Cantos, ir em Ambas Marcam devido à fragilidade defensiva.",
      "conservativeCombination": "A versão super segura. Ex: Se recomendou +2.5 Gols, a segurança é +1.5 Gols.",
      "analysis": "Sua tese matemática detalhando o cálculo das médias, o peso do placar agregado real lido na tela e o motivo da escolha."
    }`;

    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const start = responseText.indexOf('{'); const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1) responseText = responseText.substring(start, end + 1);

    const json = JSON.parse(responseText);
    
    // Cálculo de Odd Justa Multiplicada
    if (json.selections && json.selections.length > 0) {
        const combinedProbDecimal = json.selections.reduce((acc: number, curr: any) => acc * ((curr.prob || 70) / 100), 1);
        json.combinedProb = Math.round(combinedProbDecimal * 100);
        json.fairOdd = Number((1 / combinedProbDecimal).toFixed(2));
    }

    if (!isAdmin) {
       // 🔴 AQUI VOCÊ SOMA +1 NO BANCO DE DADOS DO USUÁRIO
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(500).json({ error: 'Erro ao construir a aposta.' });
  }
}