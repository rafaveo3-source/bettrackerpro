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
Para atingir isso com segurança matemática, construa OBRIGATORIAMENTE uma DUPLA (Apenas 2 seleções). Evite triplas.
Ajuste as linhas para encontrar eventos individuais com probabilidade de acerto entre 75% e 82%.

⚙️ MOTOR MATEMÁTICO E TÁTICO OBRIGATÓRIO:
1. DISTRIBUIÇÃO DE POISSON: Ignore médias puras. Use exclusivamente Hit Rate real (%). Selecione apenas linhas acima de 75% de constância.
2. TAMANHO DA AMOSTRA: Analise visualmente nos gráficos a quantidade de jogos utilizados para gerar a estatística. Retorne esse número REAL na chave "sampleSize".
3. COVARIÂNCIA E LETALIDADE: Entenda o contexto do jogo. Evite overs de escanteios se houver alta eficiência ofensiva (letalidade alta = jogo acaba cedo).

⚠️ REGRAS DE MERCADOS E PROTEÇÃO:
- Proibido Resultado Final (1x2), Cartões, Jogadores.
- Proibido usar Linhas Asiáticas.
- Use apenas: [ ${selectedMarketsStr} ].
- Na alternativa conservadora, aplique o "Fractional Drop" reduzindo a linha obrigatoriamente (Ex: De Mais 1.5 Gols para Mais 0.5 Gols).

⚠️ REGRAS DE FORMATAÇÃO DE TEXTO (LEIA COM ATENÇÃO):
Nas chaves "alternativeCombination", "conservativeCombination" e "analysis", VOCÊ DEVE ESCREVER TEXTO COMUM (STRING).
É absolutamente PROIBIDO colocar Arrays, Colchetes [ ] ou chaves JSON { } dentro dessas 3 chaves.

Retorne ESTRITAMENTE um JSON válido neste formato:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Time da Casa (HT) - Mais de 2.5 Escanteios",
      "prob": 78,
      "sampleSize": 10
    }
  ],
  "alternativeCombination": "Escreva a alternativa como um texto normal. Ex: Para o jogo do Aston Villa, busque Mais de 0.5 Gols.",
  "conservativeCombination": "Escreva a versão segura como um texto normal. Ex: Aplicando o Fractional Drop, reduza as linhas para Mais de 0.5 Gols.",
  "analysis": "Tese em tópicos curtos e diretos:\\n\\n• Aplicação de Poisson:\\nEscreva a análise aqui.\\n\\n• Correlação e Letalidade:\\nEscreva a análise aqui.\\n\\n• Enquadramento da Odd:\\nEscreva a análise aqui."
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

    // 🧠 DETECÇÃO DE CORRELAÇÃO E SCORE ESTRUTURAL

let structuralRiskScore = 0;

if (json.selections && json.selections.length > 1) {

    // 🔐 Blindagem contra undefined + evita shadowing
    const marketsLower = json.selections.map((s: any) =>
        (s.market || '').toLowerCase()
    );

    const teamMentions: Record<string, number> = {};

    json.selections.forEach((sel: any) => {

        const matchStr = (sel.match || '').toLowerCase();

        // 🔥 Regex robusto para vs | x | -
        const parts = matchStr.split(/\s+(vs|x|-)\s+/i);

        // Regex com capture group retorna:
        // [0] = time casa
        // [1] = separador
        // [2] = time visitante
        if (parts.length >= 3) {

            const home = parts[0].trim();
            const away = parts[2].trim();

            const marketStr = (sel.market || '').toLowerCase();

            if (home && marketStr.includes(home)) {
                teamMentions[home] = (teamMentions[home] || 0) + 1;
            }

            if (away && marketStr.includes(away)) {
                teamMentions[away] = (teamMentions[away] || 0) + 1;
            }
        }
    });

    // 🔥 Regra 1 — Dois mercados do mesmo time
    Object.values(teamMentions).forEach(count => {
        if (count >= 2) structuralRiskScore += 2;
    });

    // 🔥 Regra 2 — Mercado HT presente
    const hasHT = marketsLower.some(m =>
        m.includes('(ht)') ||
        m.includes('1º tempo') ||
        m.includes('1o tempo')
    );

    if (hasHT) structuralRiskScore += 1;

    // 🔥 Regra 3 — Total + Mercado específico
    const hasTotalMarket = marketsLower.some(m =>
        m.includes('total')
    );

    const hasNonTotalMarket = marketsLower.some(m =>
        !m.includes('total')
    );

    if (hasTotalMarket && hasNonTotalMarket) {
        structuralRiskScore += 1;
    }
}
    // ==============================
    // 🧮 CÁLCULO DE ODD JUSTA
    // ==============================

    if (json.selections && json.selections.length > 0) {

      // 1. Calcula apenas a probabilidade pura primeiro (Sem penalidades)
      const rawCombinedProb = json.selections.reduce(
        (acc: number, curr: any) => {
          const rawProb = (Number(curr.prob) || 75) / 100;
          return acc * rawProb;
        }, 1
      );

      // 2. Extrai a média de amostragem do bilhete para punir uma vez só
      const avgSample = json.selections.reduce((acc: number, curr: any) => acc + (Number(curr.sampleSize) || 10), 0) / json.selections.length;

      const confidenceAdjustment =
        avgSample >= 15 ? 1 :
        avgSample >= 10 ? 0.97 :
        avgSample >= 7 ? 0.94 :
        0.90;

      const SHRINK_FACTOR = 0.93;
      const CORRELATION_PENALTY = 0.97;

      const structuralPenalty =
        structuralRiskScore >= 4 ? 0.90 :
        structuralRiskScore === 3 ? 0.93 :
        structuralRiskScore === 2 ? 0.95 :
        structuralRiskScore === 1 ? 0.97 :
        1;

      // 3. Aplica todas as penalidades juntas no final (Juros simples)
      const finalProb =
        rawCombinedProb *
        SHRINK_FACTOR *
        confidenceAdjustment *
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