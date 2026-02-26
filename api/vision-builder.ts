import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyGameProfile } from '../utils/gameProfileClassifier';
import { buildDynamicMultiple } from '../utils/multiBuilderEngine';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email, markets } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ error: 'Chave de API ausente.' });

    if (!email)
      return res.status(400).json({ error: 'E-mail ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
        topP: 0.1,
        topK: 1,
        candidateCount: 1,
        maxOutputTokens: 2048
      }
    });

    const prompt = `
Você é um extrator estatístico visual.

Leia a imagem e extraia APENAS números visíveis.

NUNCA invente.
NUNCA estime.
NUNCA complete informação ausente.

Se não conseguir ler um valor claramente, retorne null.

Retorne apenas JSON neste formato:

{
  "stats": {
    "home_goals_avg": null,
    "away_goals_avg": null,
    "home_corners_avg": null,
    "away_corners_avg": null,
    "over15_hit_rate": null,
    "over25_hit_rate": null,
    "ht_goal_rate": null,
    "second_half_goal_rate": null
  },
  "evidence": {
    "home_goals_avg": "",
    "away_goals_avg": "",
    "home_corners_avg": "",
    "away_corners_avg": "",
    "over15_hit_rate": "",
    "over25_hit_rate": "",
    "ht_goal_rate": "",
    "second_half_goal_rate": ""
  }
}

Retorne apenas JSON válido.
`;

    const imageParts = images.map((img: any) => ({
      inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    let responseText = result.response.text();
    const match = responseText.match(/\{[\s\S]*\}/);

    if (!match) throw new Error('Formato inválido.');

    const parsed = JSON.parse(match[0]);

    // 🔒 Validação obrigatória de evidência
    for (const key in parsed.stats) {
      if (parsed.stats[key] !== null && !parsed.evidence[key]) {
        parsed.stats[key] = null;
      }
    }

    const profile = classifyGameProfile(parsed.stats);

    const bet = buildDynamicMultiple(parsed.stats, markets || []);

    return res.status(200).json({
      profile,
      stats: parsed.stats,
      bet
    });

  } catch (error: any) {
    console.error("Vision Builder Error:", error);
    return res.status(500).json({ error: 'Erro ao processar builder.' });
  }
}