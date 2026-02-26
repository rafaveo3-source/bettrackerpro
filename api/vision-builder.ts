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
            temperature: 0.1, // Quase zero criatividade para evitar alucinações
        }
    });

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios, Resultado da Partida';

    // 🔥 SUPER PROMPT: OTIMIZADO PARA MÚLTIPLAS DE JOGOS DIFERENTES
    const prompt = `Você é um Analista Quantitativo HFT Especialista em criar Apostas Múltiplas (Acumuladas) de alta segurança.
    O usuário enviou prints de estatísticas de DIFERENTES partidas de futebol.

    🎯 SUA MISSÃO:
    Para CADA IMAGEM de jogo enviada, você deve extrair 1 (UMA) seleção de aposta com altíssima taxa de acerto estatístico.
    Se o usuário enviou 2 imagens, retorne 2 seleções. Se enviou 3 imagens, retorne 3 seleções.

    ⚠️ REGRA DE OURO 1: FIREWALL DE MERCADOS
    O usuário ordenou que você busque oportunidades APENAS nestes mercados: [ ${selectedMarketsStr} ].
    Você NÃO PODE sugerir apostas fora desta lista.

    ⚠️ REGRA DE OURO 2: ANTI-ALUCINAÇÃO
    Baseie sua decisão ÚNICA E EXCLUSIVAMENTE nos painéis de "Previsões", "Hit Rate", "Tendências" e "Médias" que estão ESCRITOS na imagem. 
    Ignore textos minúsculos sobre "1ª Mão" ou "Placar Agregado" se não estiverem 100% claros. Confie nas porcentagens verdes (Ex: "75% Mais de 1.5 Gols").

    Sua saída deve conter:
    1. A Múltipla Principal cruzando as análises dos jogos.
    2. Uma Combinação Alternativa (usando os mercados permitidos).
    3. Uma "Margem de Segurança" (A versão mais conservadora possível das linhas sugeridas).

    Retorne ESTRITAMENTE E APENAS um JSON válido neste formato exato (sem markdown em volta, sem crases):
    {
      "selections": [
        {
          "match": "Time A vs Time B",
          "market": "Partida (FT) - Mais de 1.5 Gols",
          "prob": 85
        },
        {
          "match": "Time C vs Time D",
          "market": "Time da Casa (FT) - Mais de 4.5 Escanteios",
          "prob": 78
        }
      ],
      "alternativeCombination": "Sua sugestão de aposta alternativa para estes mesmos jogos.",
      "conservativeCombination": "A versão super segura (ex: reduzir as linhas de gols ou cantos de ambos os jogos).",
      "analysis": "Justificativa matemática baseada nas porcentagens de acerto e médias que você Efetivamente leu nas imagens."
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
        // Multiplica as probabilidades (Ex: 0.85 * 0.78 = 0.663)
        const combinedProbDecimal = json.selections.reduce((acc: number, curr: any) => acc * ((curr.prob || 70) / 100), 1);
        json.combinedProb = Math.round(combinedProbDecimal * 100);
        // Odd Justa é o inverso da probabilidade combinada (Ex: 1 / 0.663 = @1.50)
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