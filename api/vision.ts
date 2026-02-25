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
Você é um Analista Quantitativo HFT especialista em leitura visual multi-plataforma para mercados de GOLS (EXG) e ESCANTEIOS (EXC).

A imagem pode ser de:
- Bet365
- SofaScore
- Flashscore
- Betano
- RoboTip
- CornerPro
- PackBall
- ou outro provedor.

=====================================================
PASSO 1 — IDENTIFIQUE O TIPO DE LAYOUT
=====================================================

Classifique o layout como:
"bet365" | "sofascore" | "flashscore" | "betano" | 
"robottip" | "cornerpro" | "packball" | "unknown"

Use:
- posição do placar
- tipo de gráfico (radar, barras verticais, barras horizontais, timeline)
- presença de xG
- estilo visual
- idioma exibido

=====================================================
PASSO 2 — EXTRAIA DADOS POR SIGNIFICADO (NUNCA POR POSIÇÃO FIXA)
=====================================================

Nunca confie apenas na ordem visual dos elementos.
Use contexto textual e ícones corretos.

ESCANTEIOS:
- Palavras: "Escanteios", "Cantos", "Corners"
- Ícone de bandeira triangular
- Número imediatamente associado à bandeira

CARTÃO VERMELHO:
- Quadrado vermelho sólido
- Palavra "Cartões vermelhos"
- Número associado ao quadrado vermelho
- NUNCA confundir com bandeira de escanteio

CARTÃO AMARELO:
- Quadrado amarelo sólido
- Palavra "Cartões amarelos"

ATAQUES PERIGOSOS:
- Label: "Ataques Perigosos" ou "Dangerous Attacks"
- Sempre existem dois números (time esquerda vs direita)

CHUTES NO ALVO:
- "Finalizações no alvo"
- "Chutes no alvo"
- "Shots on Target"

CHUTES PARA FORA:
- "Finalizações para fora"
- "Shots off target"

POSSE:
- Barra verde/vermelha
- Percentuais (ex: 44% vs 56%)

=====================================================
PASSO 3 — DEFINIR TIME QUE ESTÁ PRESSIONANDO
=====================================================

O time pressionando é aquele que apresenta:

Prioridade 1:
- Maior número de Ataques Perigosos

Se empatar:
- Maior número de finalizações

Se ainda empatar:
- Maior domínio visual no gráfico recente

Definições:
apPress = maior valor
apDef = menor valor

=====================================================
PASSO 4 — CARTÃO VERMELHO
=====================================================

Se houver cartão vermelho:

- Se pertence ao time com MAIOR AP → redCard = "pressing"
- Se pertence ao time com MENOR AP → redCard = "defending"
- Se ambos 0 → redCard = "none"

Se houver dúvida visual → redCard = "none"

Nunca inferir cartão vermelho sem confirmação visual clara.

=====================================================
PASSO 5 — PRESSURE TREND
=====================================================

Observe apenas o gráfico recente (últimos minutos):

"increasing" se:
- barras crescendo no final
- sequência de eventos ofensivos

"decreasing" se:
- queda clara no final

"stable" se:
- padrão lateral

Se não for possível determinar → "stable"

=====================================================
PASSO 6 — MATCH TEMPERATURE
=====================================================

"intense" se:
- muitos eventos recentes
- picos ofensivos
- cartões
- volume alto de finalizações

"calm" se:
- gráfico baixo
- poucos eventos
- ritmo lento

=====================================================
PASSO 7 — NECESSIDADE TÁTICA
=====================================================

needsGoal = true se:
- empate nos minutos finais
- derrota mínima com pressão visível
- domínio territorial forte no fim

needsGoal = false se:
- placar elástico
- ritmo baixo
- jogo controlado

=====================================================
PASSO 8 — RECENT GOAL
=====================================================

recentGoal = true se:
- houver marcação de gol nos últimos minutos visíveis na timeline

Caso contrário → false

=====================================================
REGRAS IMPORTANTES
=====================================================

- NÃO invente valores.
- Se não conseguir identificar com segurança → retorne null.
- NÃO retorne texto explicativo.
- Retorne APENAS JSON válido.
- Todos os números devem ser numéricos, não strings.

=====================================================
RETORNE APENAS ESTE JSON:
=====================================================

{
  "provider": "",
  "min": null,
  "target": null,
  "apPress": null,
  "apDef": null,
  "sot": null,
  "sofft": null,
  "recentShots": null,
  "recentCorners": null,
  "pressureTrend": "increasing" | "stable" | "decreasing",
  "matchTemperature": "intense" | "calm",
  "redCard": "none" | "pressing" | "defending",
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