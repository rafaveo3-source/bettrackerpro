import { GoogleGenerativeAI } from '@google/generative-ai';

// 🔥 Aumenta o limite de tempo da Vercel para 60 segundos (Evita o Erro 500 ao ler muitas imagens)
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'GOLS, ESCANTEIOS, RESULTADO';

    // 🔥 SUPER PROMPT V4 (ANTI-ERRO 500 E ANTI-ALUCINAÇÃO CORNERPRO)
    const prompt = `Você é um Analista Quantitativo HFT e Algoritmo Precificador Pré-Live Especialista em Apostas Combinadas.
    Você receberá imagens contendo estatísticas pré-jogo (SofaScore, Flashscore, CornerPro).
    
    ⚠️ REGRA DE OURO - ANTI-ALUCINAÇÃO DE PLACAR AGREGADO (CORNERPRO):
    Na plataforma CornerPro, o histórico do primeiro jogo aparece muito pequeno como "1ª Mão (X-Y)". O número "X" (esquerda) pertence ao time MANDANTE de hoje. O "Y" pertence ao VISITANTE de hoje. 
    PROIBIÇÃO: Se você se sentir minimamente confuso ao ler esse texto minúsculo, NÃO MENCIONE O PLACAR AGREGADO NA SUA ANÁLISE. Em vez de focar no agregado, baseie sua decisão 100% nas "Previsões para o Jogo" (os botões verdes/vermelhos com as porcentagens % claras) e na tabela de Média de Gols/Cantos.

    🧠 INTELIGÊNCIA MATEMÁTICA OBRIGATÓRIA:
    Não se deixe levar por achismos. Aplique raciocínio quantitativo:
    1. Olhe para a Taxa de Acerto (Hit Rate). Se a imagem diz "75% Mais de 1.5 Gols", essa é sua base matemática principal.
    2. Avalie as Médias (Ex: Média de Cantos a favor = 6.40, contra = 4.20).
    3. Se o "Field Tilt" (Ação no terço final) do favorito for maior que 60%, priorize mercados ofensivos para ele.

    🎯 MERCADOS PERMITIDOS (FOCO DO USUÁRIO):
    Explore APENAS combinações dentro destes mercados: [ ${selectedMarketsStr} ]. 
    Formate cada seleção no padrão: "[Escopo] ([Tempo]) - [Mercado]" (Ex: "Partida (FT) - Mais de 1.5 Gols").

    Sua saída deve conter:
    1. A Múltipla Principal (Odd combinada ideal entre 1.50 e 2.00).
    2. Uma Combinação Alternativa (Caso a principal não agrade o usuário).
    3. Uma "Margem de Segurança" (A versão mais conservadora da sua aposta principal, para alavancagem segura).

    Retorne ESTRITAMENTE um JSON válido neste formato exato (sem markdown em volta):
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
      "analysis": "Sua tese matemática baseada apenas nos números absolutos e % que você tem 100% de certeza que leu na imagem."
    }`;

    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    let responseText = result.response.text();

    // 🛡️ Extrator de JSON blindado (Garante que se a IA falar besteira, pegamos só o JSON)
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('A IA não retornou um formato de dados válido.');
    
    const json = JSON.parse(match[0]);
    
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
    return res.status(500).json({ error: error.message || 'Erro ao construir a aposta.' });
  }
}