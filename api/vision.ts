import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { image, mimeType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🔥 UNIVERSAL FOOTBALL VISION PARSER V5

const prompt = `
Você é um Analista Quantitativo HFT especialista em leitura visual multi-plataforma.

A imagem pode ser de:
- Bet365
- SofaScore
- Flashscore
- Betano
- RoboTip
- CornerPro
- PackBall
- ou outro provedor.

PASSO 1 — IDENTIFIQUE O TIPO DE LAYOUT:
Classifique o layout como:
- "bet365"
- "sofascore"
- "flashscore"
- "betano"
- "robottip"
- "cornerpro"
- "packball"
- "unknown"

Use:
- posição do placar
- formato de gráfico (barras verticais, horizontais, radar, timeline)
- estilo de ícones
- cores predominantes

PASSO 2 — EXTRAIA DADOS POR SIGNIFICADO, NÃO POR POSIÇÃO

Nunca confie apenas na ordem dos ícones.
Identifique pelo CONTEXTO VISUAL:

ESCANTEIOS:
- palavra "Escanteios", "Cantos", "Corners"
- ícone de bandeira triangular
- número ao lado da bandeira

CARTÃO VERMELHO:
- quadrado vermelho
- palavra "Cartões vermelhos"
- número ao lado do quadrado vermelho

CARTÃO AMARELO:
- quadrado amarelo
- palavra "Cartões amarelos"

ATAQUES PERIGOSOS:
- label: "Ataques Perigosos", "Dangerous Attacks"
- sempre existem dois números (esquerda vs direita)

CHUTES NO ALVO:
- "Finalizações no alvo"
- "Chutes no alvo"
- "Shots on Target"

POSSE:
- barra verde/vermelha
- porcentagens 44% vs 56%

PASSO 3 — DEFINIR TIME QUE PRESSIONA

O time que pressiona é:
- maior Ataque Perigoso
- OU maior volume de finalizações
- OU maior domínio visual no gráfico

apPress = maior valor
apDef = menor valor

PASSO 4 — CARTÃO VERMELHO

Se houver cartão vermelho:
- se pertence ao time com maior AP → redCard = "pressing"
- se pertence ao time com menor AP → redCard = "defending"
- se nenhum → "none"

Nunca confunda bandeira (escanteio) com cartão vermelho.

PASSO 5 — TREND

Se gráfico de barras estiver crescendo nos últimos minutos → "increasing"
Se lateral → "stable"
Se diminuindo → "decreasing"

PASSO 6 — TEMPERATURA

intense se:
- muitos eventos recentes
- picos de barras
- cartões
- volume alto

calm se:
- gráfico baixo
- poucas finalizações

PASSO 7 — NECESSIDADE

needsGoal = true se:
- empate no fim
- derrota mínima
- grande domínio territorial
- pressão visual forte no fim

false se:
- placar elástico
- ritmo baixo

RETORNE APENAS JSON:

{
  "provider": "",
  "min": "",
  "target": "",
  "apPress": "",
  "apDef": "",
  "sot": "",
  "sofft": "",
  "recentShots": "",
  "recentCorners": "",
  "pressureTrend": "",
  "matchTemperature": "",
  "redCard": "",
  "recentGoal": false,
  "needsGoal": false
}
`;
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: image, mimeType: mimeType || 'image/png' } }
    ]);

    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1) responseText = responseText.substring(start, end + 1);

    const json = JSON.parse(responseText);

// 🛡️ BLINDAGEM EXTRA (ANTI-ERRO)
if (!json.redCard || !["none", "pressing", "defending"].includes(json.redCard)) {
  json.redCard = "none";
}

if (!json.pressureTrend || !["increasing", "stable", "decreasing"].includes(json.pressureTrend)) {
  json.pressureTrend = "stable";
}

if (!json.matchTemperature || !["intense", "calm"].includes(json.matchTemperature)) {
  json.matchTemperature = "calm";
}
    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision AI:", error);
    return res.status(500).json({ error: 'Erro ao analisar contexto visual.' });
  }
}