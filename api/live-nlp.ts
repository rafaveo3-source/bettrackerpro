import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { textData, mode } = req.body;

    if (!textData || textData.length < 20) {
      return res.status(400).json({ error: 'Texto insuficiente.' });
    }

    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    // 🔥 PROMPT V8 (ROBUSTO PRA QUALQUER SITE)
    const prompt = `
Você é um EXTRATOR QUANTITATIVO PROFISSIONAL (NÍVEL TRADING).

OBJETIVO:
Transformar texto bagunçado (Flashscore, SofaScore, CornerPro, RoboTip)
em um JSON ESTRUTURADO E MATEMÁTICO.

REGRAS CRÍTICAS:

1. EXTRAIA DADOS POR TIME (NUNCA MÉDIA)
2. PRIORIDADE MÁXIMA:
   - "Dados do Jogo"
   - "Estatísticas"
3. IGNORE:
   - comentários
   - eventos
   - timeline

4. CANTOS:
Procure linha:
"Escanteios" ou "Cantos"
Ex:
6 3 → home=6 away=3

5. ATAQUES PERIGOSOS:
"ataques perigosos" ou "Ataques P."

6. FINALIZAÇÕES:
- no alvo
- totais

7. CRUZAMENTOS:
se existir → usar
se não → 0

8. MINUTO:
se FT → 90

---

RETORNE EXATAMENTE:

{
  "homeTeam": "",
  "awayTeam": "",
  "score": "0-0",
  "min": 66,

  "home": {
    "corners": 0,
    "attacks": 0,
    "dangerousAttacks": 0,
    "shots": 0,
    "shotsOnTarget": 0,
    "crosses": 0
  },

  "away": {
    "corners": 0,
    "attacks": 0,
    "dangerousAttacks": 0,
    "shots": 0,
    "shotsOnTarget": 0,
    "crosses": 0
  }
}

TEXTO:
${textData}
`;

    let raw = "";

    // 🔁 TENTATIVA 1: GEMINI
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(prompt);
      raw = result.response.text();

    } catch (e) {
      console.error("Gemini falhou:", e?.message);
      
      // 🔁 FALLBACK REAL (PROMPT DIFERENTE)
      if (openai) {
        const fallbackPrompt = `
Extraia dados estruturados de futebol deste texto.

Formato obrigatório JSON.

Foque em:
- cantos
- ataques perigosos
- finalizações

Texto:
${textData}
`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: fallbackPrompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        });

        raw = response.choices[0].message.content || "";
      } else {
        throw new Error("Sem fallback disponível");
      }
    }

    // 🔧 LIMPEZA
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    const json = JSON.parse(raw);

    // 🔥 NORMALIZAÇÃO PROFISSIONAL

    const home = json.home || {};
    const away = json.away || {};

    const safe = (v: any) => parseInt(v) || 0;

    const data = {
      homeTeam: json.homeTeam || "Home",
      awayTeam: json.awayTeam || "Away",
      score: json.score || "0-0",
      min: safe(json.min),

      home: {
        corners: safe(home.corners),
        attacks: safe(home.attacks),
        dangerousAttacks: safe(home.dangerousAttacks),
        shots: safe(home.shots),
        shotsOnTarget: safe(home.shotsOnTarget),
        crosses: safe(home.crosses)
      },

      away: {
        corners: safe(away.corners),
        attacks: safe(away.attacks),
        dangerousAttacks: safe(away.dangerousAttacks),
        shots: safe(away.shots),
        shotsOnTarget: safe(away.shotsOnTarget),
        crosses: safe(away.crosses)
      }
    };

    // 🧠 FEATURES QUANT (O SEGREDO)

    const homePressure = data.home.dangerousAttacks;
    const awayPressure = data.away.dangerousAttacks;

    const leader = homePressure > awayPressure ? "home" : "away";

    const pressureDiff = Math.abs(homePressure - awayPressure);

    const totalShots = data.home.shots + data.away.shots;
    const totalSOT = data.home.shotsOnTarget + data.away.shotsOnTarget;

    const efficiency = totalShots > 0 ? totalSOT / totalShots : 0;

    const intensity = (homePressure + awayPressure) / Math.max(data.min, 1);

    const needsGoal =
      data.score === "0-0" ||
      (leader === "home" && data.score.startsWith("0-1")) ||
      (leader === "away" && data.score.startsWith("1-0"));

    return res.status(200).json({
      ...data,

      total: {
        corners: data.home.corners + data.away.corners,
        shots: totalShots,
        shotsOnTarget: totalSOT
      },

      meta: {
        pressureLeader: leader,
        pressureDiff,
        intensity,
        efficiency,
        needsGoal
      }
    });

  } catch (err: any) {
    console.error("Erro V8:", err);
    return res.status(400).json({ error: err.message });
  }
}