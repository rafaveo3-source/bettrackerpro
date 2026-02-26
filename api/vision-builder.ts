import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(400).json({ error: 'Autenticação inválida. E-mail ausente.' });

    const isAdmin = email === adminEmail;

    if (!isAdmin) {
        // 🔴 FUTURA INTEGRAÇÃO COM BANCO DE DADOS AQUI (Supabase/Firebase)
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🔥 SUPER PROMPT V2 (TREINADO COM A BIBLIOTECA ESTRATÉGICA)
    const prompt = `Você é um Analista Quantitativo e Algoritmo Precificador (Bookmaker) Pré-Live Especialista em Múltiplas e Construtor de Apostas.
    Você receberá entre 1 a 4 imagens contendo estatísticas pré-jogo de futebol.
    
    ESTRATÉGIA E PRIORIDADES:
    Sua missão é extrair 1 seleção de ALTÍSSIMO VALOR (EV+) para CADA JOGO enviado nas imagens para montar um Bilhete Combinado (Múltipla).
    
    ⚠️ REGRA DE OURO: EVITE USAR MERCADO DE CARTÕES a menos que seja a única opção viável. PRIORIZE ABSOLUTAMENTE os mercados de GOLS, ESCANTEIOS e RESULTADO DA PARTIDA. Diversifique as escolhas entre os jogos.

    MERCADOS PERMITIDOS (Baseado na Biblioteca Estratégica):
    - GOLS: Mais/Menos Gols (Ex: 1.5, 2.5), Ambas as Equipes Marcam (Sim/Não), Total de Gols do Time da Casa/Visitante.
    - ESCANTEIOS: Total de Escanteios, Escanteios do Time da Casa/Visitante.
    - RESULTADO: 1X2 (Vencedor), Dupla Chance, Empate Anula Aposta.
    - TEMPO: Especifique se a aposta é para o Jogo Todo (FT) ou 1º Tempo (HT).

    PADRONIZAÇÃO OBRIGATÓRIA DA SELEÇÃO (Seja cirúrgico na nomenclatura):
    Você DEVE formatar o campo "market" seguindo exatamente este padrão: [Escopo] ([Tempo]) - [Mercado].
    Exemplos Corretos:
    - "Partida (FT) - Mais de 1.5 Gols"
    - "Partida (HT) - Mais de 4.5 Escanteios"
    - "Time da Casa (FT) - Mais de 1.5 Gols"
    - "Time Visitante (FT) - Empate Anula Aposta"
    - "Partida (FT) - Ambas as Equipes Marcam (Sim)"

    O alvo final da sua múltipla (a multiplicação das probabilidades de todas as seleções) deve gerar uma Odd Justa (Fair Line) final estimada entre @1.50 e @2.50.

    Retorne APENAS um JSON válido neste formato exato (sem markdown):
    {
      "selections": [
        {
          "match": "Nome do Jogo A",
          "market": "Time da Casa (FT) - Mais de 4.5 Escanteios",
          "prob": 82
        },
        {
          "match": "Nome do Jogo B",
          "market": "Partida (FT) - Mais de 1.5 Gols",
          "prob": 88
        }
      ],
      "analysis": "Explique de forma técnica por que essas seleções foram feitas. Cite métricas de H2H, médias de gols/cantos lidas nas imagens e por que evitou outros mercados."
    }`;

    // Monta o array de dados inline para o Gemini (suporta múltiplas imagens de uma vez)
    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const start = responseText.indexOf('{'); const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1) responseText = responseText.substring(start, end + 1);

    const json = JSON.parse(responseText);
    
    // Cálculo de Odd Justa (Combina 2, 3 ou 4 seleções automaticamente)
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
    return res.status(500).json({ error: 'Erro ao construir a aposta.' });
  }
}