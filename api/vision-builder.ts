import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email, markets } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey)
      return res.status(500).json({ error: 'Chave de API ausente.' });

    if (!email)
      return res.status(400).json({ error: 'Autenticação inválida. E-mail ausente.' });

    const isAdmin = email === adminEmail;

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
      },
    });

    const selectedMarketsStr =
      markets && markets.length > 0
        ? markets.join(', ')
        : 'Gols, Escanteios';

    const prompt = `Você é um Analista Quantitativo HFT de Elite e Gestor de Risco Esportivo.
Sua missão é criar uma Aposta Combinada (Múltipla) lendo as imagens estatísticas fornecidas.

🎯 SUA META DE ODD E PROBABILIDADE (INVIOLÁVEL):
A Odd Justa Final do seu bilhete deve ficar EXATAMENTE entre @1.60 e @2.00.
Para isso, ajuste as linhas para encontrar eventos individuais com probabilidade entre 75% e 82%.

⚙️ MOTOR MATEMÁTICO E TÁTICO OBRIGATÓRIO:

1. DISTRIBUIÇÃO DE POISSON E CONSTÂNCIA:
Ignore médias puras. Use exclusivamente Hit Rate real.
Selecione apenas linhas acima de 75% de constância.

2. IDENTIFICAÇÃO DO TAMANHO DA AMOSTRA (OBRIGATÓRIO):
Analise visualmente nas imagens quantos jogos compõem aquela estatística 
(ex: últimos 5, 10 ou 20 jogos).
Retorne esse número REAL na chave "sampleSize".
NUNCA use número fixo ou padrão.

3. COVARIÂNCIA (GAME SCRIPT):
Entenda o contexto do jogo e evite correlações perigosas.

4. ARMADILHA DA LETALIDADE:
Evite overs de escanteios se houver alta eficiência ofensiva.

⚠️ REGRAS:
- Proibido Resultado, Cartões, Jogadores.
- Proibido Linhas Asiáticas.
- Use apenas: [ ${selectedMarketsStr} ].

Retorne ESTRITAMENTE um JSON válido:

{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Time da Casa (HT) - Mais de 2.5 Escanteios",
      "prob": 78,
      "sampleSize": 10
    }
  ],
  "alternativeCombination": "...",
  "conservativeCombination": "...",
  "analysis": "..."
}`;

    const imageParts = images.map((img: any) => ({
      inlineData: { data: img.base64, mimeType: img.mimeType },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    const matchJson = responseText.match(/\{[\s\S]*\}/);
    if (!matchJson)
      throw new Error('A IA não conseguiu formatar os dados.');

    let json;
    try {
      json = JSON.parse(matchJson[0]);
    } catch {
      throw new Error('Falha na conversão do JSON retornado.');
    }

    // ==============================
    // 🧠 DETECÇÃO DE CORRELAÇÃO
    // ==============================

    let structuralRiskScore = 0;

    if (json.selections && json.selections.length > 1) {

      const marketsLower = json.selections.map((s: any) =>
        (s.market || '').toLowerCase()
      );

      const teamMentions: Record<string, number> = {};

      json.selections.forEach((sel: any) => {

        const matchStr = (sel.match || '').toLowerCase();

        // Regex robusto para separar times
        const parts = matchStr.split(/\s+(vs|x|-)\s+/i);

        if (parts.length >= 3) {

          const home = parts[0].trim();
          const away = parts[2].trim();

          const marketStr = (sel.market || '').toLowerCase();

          if (home && marketStr.includes(home))
            teamMentions[home] = (teamMentions[home] || 0) + 1;

          if (away && marketStr.includes(away))
            teamMentions[away] = (teamMentions[away] || 0) + 1;
        }
      });

      Object.values(teamMentions).forEach((count) => {
        if (count >= 2) structuralRiskScore += 2;
      });

      const hasHT = marketsLower.some((m) =>
        m.includes('(ht)') ||
        m.includes('1º tempo') ||
        m.includes('1o tempo')
      );

      if (hasHT) structuralRiskScore += 1;

      const hasTotal = marketsLower.some((m) =>
        m.includes('total')
      );

      const hasTeamSpecific = marketsLower.some((m) =>
        !m.includes('total')
      );

      if (hasTotal && hasTeamSpecific)
        structuralRiskScore += 1;
    }

    // ==============================
    // 🧮 CÁLCULO DE ODD JUSTA
    // ==============================

    if (json.selections && json.selections.length > 0) {

      const SHRINK_FACTOR = 0.93;
      const CORRELATION_PENALTY = 0.97;

      const combinedProbDecimal = json.selections.reduce(
        (acc: number, curr: any) => {

          const rawProb = (Number(curr.prob) || 75) / 100;
          const sampleSize = Number(curr.sampleSize) || 10;

          const confidenceAdjustment =
            sampleSize >= 15 ? 1 :
            sampleSize >= 10 ? 0.97 :
            sampleSize >= 7 ? 0.94 :
            0.90;

          const adjustedProb =
            rawProb *
            SHRINK_FACTOR *
            confidenceAdjustment;

          return acc * adjustedProb;
        },
        1
      );

      const structuralPenalty =
        structuralRiskScore >= 4 ? 0.90 :
        structuralRiskScore === 3 ? 0.93 :
        structuralRiskScore === 2 ? 0.95 :
        structuralRiskScore === 1 ? 0.97 :
        1;

      const finalProb =
        combinedProbDecimal *
        CORRELATION_PENALTY *
        structuralPenalty;

      json.combinedProb = Math.round(finalProb * 100);
      json.fairOdd = Number((1 / finalProb).toFixed(2));

    } else {
      throw new Error('Nenhuma seleção válida encontrada.');
    }

    json.structuralRiskScore = structuralRiskScore;

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(400).json({
      error: error.message || 'Erro ao processar múltipla.'
    });
  }
}