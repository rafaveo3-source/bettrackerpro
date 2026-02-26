import { GoogleGenerativeAI } from '@google/generative-ai';

// 🔥 Aumenta o tempo limite da Vercel para 60 segundos (Evita Erro 500 no Timeout)
export const maxDuration = 60;

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
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.1, // Zero criatividade, 100% matemática
        }
    });

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    // 🔥 SUPER PROMPT: FAIXA DE ODD FORÇADA E MERCADOS PROFUNDOS
    const prompt = `Você é um Analista Quantitativo HFT Especialista em criar Apostas Múltiplas.
    O usuário enviou prints de estatísticas de DIFERENTES partidas de futebol.

    🎯 O SEU ALVO MATEMÁTICO (OBRIGATÓRIO):
    A sua missão é montar um Bilhete Combinado cuja ODD JUSTA FINAL fique entre @1.60 e @2.00.
    Para atingir isso, VOCÊ NÃO PODE selecionar linhas com 95% ou 98% de chance (pois elas têm odd de @1.05 e destroem o valor). 
    Você DEVE ajustar a linha (Ex: trocar +0.5 gols por +1.5 gols) para encontrar seleções que tenham individualmente entre 72% e 82% de probabilidade de acerto.

    ⚠️ REGRA DE OURO 1: FIREWALL DE MERCADOS (APENAS GOLS E CANTOS)
    Você está ESTRITAMENTE PROIBIDO de sugerir apostas de Cartões, Resultado (1x2), Vencedor ou Dupla Chance.
    Você deve mergulhar fundo APENAS nas variações destes mercados solicitados: [ ${selectedMarketsStr} ].
    Variações que você DEVE explorar para achar a odd correta:
    - GOLS: Mais/Menos Gols (Partida, 1º Tempo HT, 2º Tempo), Gols Exclusivos do Time Casa/Visitante, Ambas Marcam.
    - ESCANTEIOS: Mais/Menos Cantos (Partida, 1º Tempo HT), Cantos Exclusivos do Time Casa/Visitante, Race Cantos (Primeiro a marcar 5 ou 7 cantos), Handicap de Cantos.

    ⚠️ REGRA DE OURO 2: ANTI-ALUCINAÇÃO E PLACAR AGREGADO
    Baseie sua decisão ÚNICA E EXCLUSIVAMENTE nos painéis de "Previsões", "Hit Rate", "Tendências" e "Médias" ESCRITOS na imagem. 
    Se for jogo de "2ª Mão" (Volta) e o texto do primeiro jogo for minúsculo ou confuso, NÃO CITE QUEM ESTÁ EM DESVANTAGEM. Apenas foque nas porcentagens absolutas visíveis (Ex: "80% Mais 1.5 Gols").

    Sua saída deve conter:
    1. A Múltipla Principal cruzando as análises (Mirando odd 1.60 a 2.00).
    2. Uma Combinação Alternativa (usando outras variações de Gols/Cantos).
    3. Uma "Margem de Segurança" (Reduzindo as linhas para o caso do usuário ser super conservador).

    Retorne ESTRITAMENTE um JSON válido neste formato exato:
    {
      "selections": [
        {
          "match": "Time A vs Time B",
          "market": "Time da Casa (HT) - Mais de 2.5 Escanteios",
          "prob": 78
        },
        {
          "match": "Time C vs Time D",
          "market": "Partida (FT) - Mais de 1.5 Gols",
          "prob": 76
        }
      ],
      "alternativeCombination": "Sua sugestão alternativa focada em Gols ou Cantos.",
      "conservativeCombination": "A versão super segura (linhas reduzidas).",
      "analysis": "Sua tese quantitativa provando como as porcentagens lidas nos gráficos suportam a escolha dessas linhas específicas para bater a meta de Odd 1.60 a 2.00."
    }`;

    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    let responseText = result.response.text();

    // 🛡️ Extrator de JSON blindado
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('A IA não conseguiu formatar os dados. Tente novamente.');
    
    let json;
    try {
        json = JSON.parse(match[0]);
    } catch (e) {
        throw new Error('Falha na conversão dos dados matemáticos.');
    }
    
    // 🧮 CÁLCULO DE ODD JUSTA CROSS-MATCH (Múltipla Matemática Real)
    if (json.selections && json.selections.length > 0) {
        const combinedProbDecimal = json.selections.reduce((acc: number, curr: any) => acc * ((curr.prob || 70) / 100), 1);
        json.combinedProb = Math.round(combinedProbDecimal * 100);
        json.fairOdd = Number((1 / combinedProbDecimal).toFixed(2));
    } else {
        throw new Error('Não foi possível extrair seleções válidas com as regras informadas.');
    }

    if (!isAdmin) {
       // 🔴 AQUI VOCÊ SOMA +1 NO BANCO DE DADOS DO USUÁRIO
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar as múltiplas cruzadas.' });
  }
}