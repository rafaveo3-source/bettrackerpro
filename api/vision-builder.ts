import { GoogleGenerativeAI } from '@google/generative-ai';
import { classifyGameProfile } from '../../utils/gameProfileClassifier';
import { buildDynamicMultiple } from '../../utils/multiBuilderEngine';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {

    const { images, email, markets } = req.body;

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
        candidateCount: 1,
        maxOutputTokens: 2048
      }
    });

    const prompt = `
Você é um extrator estatístico visual.
Retorne apenas JSON válido no formato solicitado.
`;

    const imageParts = images.map((img: any) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType || "image/png"
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    let responseText = result.response.text();

    const match = responseText.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: "IA retornou formato inválido." });
    }

    let parsed;

    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return res.status(500).json({ error: "Erro ao fazer parse da IA." });
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

    console.error("VISION BUILDER ERROR:", error);

    return res.status(500).json({
      error: error.message || "Erro interno no Vision Builder."
    });
  }
}