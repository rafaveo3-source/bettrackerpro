import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyGameProfile } from './_utils/gameProfileClassifier';
import { buildDynamicMultiple } from './_utils/multiBuilderEngine';

export default async function handler(req: any, res: any) {

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {

    console.log("BODY RECEBIDO:", req.body);

    const { images, markets } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Images inválidas." });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey)
      return res.status(500).json({ error: 'API key ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
        topP: 0.1,
        topK: 1,
        maxOutputTokens: 2048
      }
    });

    const prompt = `
Leia a imagem e retorne EXATAMENTE:

{
  "stats": {
    "home_goals_avg": null,
    "away_goals_avg": null,
    "home_corners_avg": null,
    "away_corners_avg": null,
    "over15_hit_rate": null,
    "over25_hit_rate": null
  }
}
`;

    const imageParts = images.map((img: any) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType || "image/png"
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    console.log("RAW GEMINI:", result);

    if (!result || !result.response) {
      return res.status(500).json({ error: "Gemini retornou vazio." });
    }

    let responseText = result.response.text();

    console.log("TEXT:", responseText);

    const match = responseText.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: "Formato inválido da IA.", raw: responseText });
    }

    let parsed;

    try {
      parsed = JSON.parse(match[0]);
    } catch (err) {
      return res.status(500).json({ error: "Erro parse JSON.", raw: responseText });
    }

    const stats = parsed.stats || {};

    const profile = classifyGameProfile(stats);
    const bet = buildDynamicMultiple(stats, markets || []);

    return res.status(200).json({
      profile,
      stats,
      bet
    });

  } catch (error: any) {

    console.error("VISION BUILDER ERROR COMPLETO:", error);

    return res.status(500).json({
      error: error.message || "Erro interno",
      stack: error.stack
    });
  }
}