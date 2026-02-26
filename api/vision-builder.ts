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

    // 🔥 SUPER PROMPT: OTIMIZAÇÃO DE LEITURA E PROIBIÇÃO DE JSON EM TEXTOS
    const prompt = `Você é um Analista Quantitativo HFT Especialista em criar Apostas Múltiplas.
    O usuário enviou prints de estatísticas de partidas de futebol.

    🎯 O SEU ALVO MATEMÁTICO (OBRIGATÓRIO):
    A sua missão é montar um Bilhete Combinado cuja ODD JUSTA FINAL fique entre @1.60 e @2.00.
    Você DEVE ajustar as linhas (Ex: trocar +0.5 gols por +1.5 gols) para encontrar seleções que tenham individualmente entre 72% e 82% de probabilidade de acerto.

    ⚠️ REGRA DE OURO 1: FIREWALL DE MERCADOS (APENAS GOLS E CANTOS)
    Você está ESTRITAMENTE PROIBIDO de sugerir apostas de Cartões, Resultado (1x2), Vencedor ou Dupla Chance.
    Explore APENAS as variações destes mercados solicitados: [ ${selectedMarketsStr} ].
    Variações: Mais/Menos Gols/Cantos (Partida, HT, 2º Tempo), Exclusivos do Time, Ambas Marcam, Race Cantos.

    ⚠️ REGRA DE OURO 2: FORMATAÇÃO DA RESPOSTA (HUMANIZADA)
    - Nas chaves "alternativeCombination" e "conservativeCombination", é ESTRITAMENTE PROIBIDO retornar arrays ou JSON. Você DEVE escrever um texto limpo, direto e legível. 
    - Na chave "analysis", NÃO escreva um bloco gigante de texto. Use TÓPICOS CURTOS com quebra de linha (\\n) focando estritamente no Hit Rate e Médias lidas.

    Retorne ESTRITAMENTE um JSON válido neste formato exato:
    {
      "selections": [
        {
          "match": "Time A vs Time B",
          "market": "Time da Casa (HT) - Mais de 2.5 Escanteios",
          "prob": 78
        }
      ],
      "alternativeCombination": "Escreva a alternativa de forma direta. Ex: 'Bologna vs Brann: Mais de 8.5 Cantos e Menos de 3.5 Gols.'",
      "conservativeCombination": "Escreva a versão segura. Ex: 'Bologna vs Brann: Mais de 0.5 Gols e Mais de 3.5 Cantos.'",
      "analysis": "Tese em tópicos curtos e diretos.\\n• Motivo 1 (Estatística)...\\n• Motivo 2 (Hit rate)..."
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