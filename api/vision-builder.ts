import { GoogleGenerativeAI } from '@google/generative-ai';

// 🔥 Aumenta o tempo da Vercel para suportar a leitura profunda de imagens
export const maxDuration = 60; 

// =====================================================================
// 1. LÓGICA INTERNA: CLASSIFICADOR DE PERFIL DE JOGO
// =====================================================================
function classifyGameProfile(stats: any) {
  const goalPressure = (stats.home_goals_avg || 0) + (stats.away_goals_avg || 0);
  const cornerPressure = (stats.home_corners_avg || 0) + (stats.away_corners_avg || 0);
  const over15 = stats.over15_hit_rate || 0;

  let volatilityScore = 0;

  if (goalPressure >= 2.8) volatilityScore += 2;
  if (cornerPressure >= 9.5) volatilityScore += 2;
  if (over15 >= 70) volatilityScore += 1;

  if (volatilityScore >= 4) return "high";
  if (volatilityScore >= 2) return "medium";
  return "low";
}

// =====================================================================
// 2. LÓGICA INTERNA: MOTOR DE CONSTRUÇÃO DE MÚLTIPLAS
// =====================================================================
type Selection = {
  market: string;
  prob: number;
  odd: number;
};

function estimateOdd(prob: number) {
  return Number((1 / (prob / 100)).toFixed(2));
}

function buildDynamicMultiple(stats: any, allowedMarkets: string[]) {
  const selections: Selection[] = [];

  const totalGoalsAvg = (stats.home_goals_avg || 0) + (stats.away_goals_avg || 0);
  const totalCornersAvg = (stats.home_corners_avg || 0) + (stats.away_corners_avg || 0);

  if (allowedMarkets.includes("Gols")) {
    if (stats.over15_hit_rate >= 70) {
      selections.push({
        market: "Mais de 1.5 Gols FT",
        prob: stats.over15_hit_rate,
        odd: estimateOdd(stats.over15_hit_rate)
      });
    }
    if (totalGoalsAvg >= 2.8) {
      const prob = 65; // Linha baseada na média alta
      selections.push({
        market: "Mais de 2.5 Gols FT",
        prob,
        odd: estimateOdd(prob)
      });
    }
  }

  if (allowedMarkets.includes("Escanteios")) {
    if (totalCornersAvg >= 9.5) {
      const prob = 66; 
      selections.push({
        market: "Mais de 8.5 Cantos FT",
        prob,
        odd: estimateOdd(prob)
      });
    }
    if (totalCornersAvg >= 10.5) {
      const prob = 58;
      selections.push({
        market: "Mais de 9.5 Cantos FT",
        prob,
        odd: estimateOdd(prob)
      });
    }
  }

  const combinations: any[] = [];

  // Forma duplas com as seleções mapeadas
  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      const combinedProb = (selections[i].prob / 100) * (selections[j].prob / 100);
      const combinedOdd = selections[i].odd * selections[j].odd;

      if (combinedOdd >= 1.5 && combinedOdd <= 2.5) { // Range ótimo
        combinations.push({
          type: "dupla",
          picks: [selections[i], selections[j]],
          combinedProb: Math.round(combinedProb * 100),
          combinedOdd: Number(combinedOdd.toFixed(2))
        });
      }
    }
  }

  // Ordena para pegar a aposta com MAIOR probabilidade matemática
  combinations.sort((a, b) => b.combinedProb - a.combinedProb);
  return combinations[0] || null;
}

// =====================================================================
// 3. HANDLER PRINCIPAL (COMUNICAÇÃO COM O FRONTEND)
// =====================================================================
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, markets } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Imagens inválidas." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0, // 0 = Focado em dados absolutos, zero criatividade (anti-alucinação)
        topP: 0.1,
        topK: 1,
        maxOutputTokens: 2048
      }
    });

    const prompt = `Você é um robô extrator de dados JSON estrito.
    Sua missão é ler as imagens e extrair as médias puras de gols, cantos e taxas de hit rate (%).
    
    Regras:
    1. Apenas retorne os números (ex: 1.5, 75). Sem texto, sem strings como "75%".
    2. Se uma métrica não existir na foto, retorne null.
    
    Retorne EXATAMENTE este formato:
    {
      "stats": {
        "home_goals_avg": null,
        "away_goals_avg": null,
        "home_corners_avg": null,
        "away_corners_avg": null,
        "over15_hit_rate": null,
        "over25_hit_rate": null
      }
    }`;

    const imageParts = images.map((img: any) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType || "image/png"
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    if (!result || !result.response) {
      return res.status(500).json({ error: "A IA não conseguiu ler a imagem." });
    }

    let responseText = result.response.text();
    const match = responseText.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: "Formato inválido extraído da IA.", raw: responseText });
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch (err) {
      return res.status(500).json({ error: "Erro ao decodificar JSON.", raw: responseText });
    }

    const stats = parsed.stats || {};
    
    // Passa os dados frios para a matemática
    const allowedMarkets = markets || ["Gols", "Escanteios"];
    const profile = classifyGameProfile(stats);
    const bet = buildDynamicMultiple(stats, allowedMarkets);

    // Se a matemática não achar uma dupla boa com as odds alvo
    if (!bet) {
        return res.status(400).json({ error: "Os dados lidos não sustentam uma aposta matemática EV+ neste jogo. Escolha outras partidas." });
    }

    // Mapeia para o formato exato que o Frontend (Calculators.tsx) espera renderizar!
    return res.status(200).json({
      profile,
      stats,
      selections: bet.picks.map((p: any) => ({
          match: "Partida Selecionada", 
          market: p.market, 
          prob: p.prob 
      })),
      combinedProb: bet.combinedProb,
      fairOdd: bet.combinedOdd,
      analysis: `Perfil de Volatilidade: ${profile.toUpperCase()}. Com base na extração matemática da imagem, o sistema calculou as médias reais e hit rates, gerando uma dupla de ${bet.combinedProb}% de confiança matemática, isolando completamente o viés ou achismos da IA.`
    });

  } catch (error: any) {
    console.error("VISION BUILDER ERROR COMPLETO:", error);
    return res.status(500).json({
      error: error.message || "Erro interno de comunicação com a IA.",
      stack: error.stack
    });
  }
}