import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email, markets } = req.body; 
    
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

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    const prompt = `Você ESTRITAMENTE um Extrator de Dados Visuais e Algoritmo Precificador. 
    Você receberá imagens de estatísticas de futebol.
    
    ⚠️ REGRA DE OURO 1: ZERO CONHECIMENTO EXTERNO (ANTI-ALUCINAÇÃO)
    Você está TERMINANTEMENTE PROIBIDO de usar seu conhecimento prévio sobre os times. NÃO invente posições em campeonatos (ex: "time x está em 5º na liga") a menos que você leia EXATAMENTE ISSO na imagem. Baseie sua análise ÚNICA E EXCLUSIVAMENTE nos números, porcentagens (%) e gráficos visíveis nos prints enviados.

    ⚠️ REGRA DE OURO 2: FIREWALL DE MERCADOS
    O usuário ordenou que você busque oportunidades APENAS nestes mercados: [ ${selectedMarketsStr} ].
    Você NÃO PODE sugerir apostas fora desta lista. Se "Resultado da Partida" não estiver na lista acima, VOCÊ NÃO PODE SUGERIR VITÓRIA OU EMPATE. Foque 100% na lista permitida.

    🧠 INTELIGÊNCIA MATEMÁTICA:
    - Olhe para a Taxa de Acerto (Hit Rate).
    - Avalie as Médias Matemáticas (Média de Cantos a favor/contra).
    - Em jogos de "1ª Mão" ou "2ª Mão", LEIA QUEM VENCEU O PRIMEIRO JOGO antes de falar em desvantagem. Se não tiver certeza absoluta, não cite o agregado.

    Sua saída deve conter:
    1. A Múltipla Principal (Odd combinada ideal entre 1.50 e 2.00) DENTRO dos mercados permitidos.
    2. Uma Combinação Alternativa da mesma partida.
    3. Uma "Margem de Segurança".

    Retorne ESTRITAMENTE um JSON válido neste formato exato:
    {
      "selections": [
        {
          "match": "Nome do Jogo",
          "market": "Mercado Escolhido",
          "prob": 85
        }
      ],
      "alternativeCombination": "Explique uma entrada alternativa dentro dos mercados permitidos.",
      "conservativeCombination": "A versão super segura.",
      "analysis": "Baseado APENAS nos números visíveis na imagem."
    }`;

    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    let responseText = result.response.text();

    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('A IA não retornou um formato de dados válido.');
    
    const json = JSON.parse(match[0]);
    
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
    return res.status(500).json({ error: error.message || 'Erro ao construir a aposta.' });
  }
}