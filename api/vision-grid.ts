import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 🛡️ ESCUDO 1: PROTEÇÃO DE ORIGEM (CORS VERCEL)
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production') {
      if (origin && !origin.includes('bettrackerpro.com.br')) {
        console.warn(`Tentativa de acesso bloqueada no Radar: ${origin}`);
        return res.status(403).json({ error: 'Acesso negado. Endpoint protegido.' });
      }
    } else {
      if (origin && !origin.includes('localhost') && !origin.includes('bettrackerpro.com.br')) {
        return res.status(403).json({ error: 'Acesso negado no ambiente de teste.' });
      }
    }

    const { image, mimeType, email } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(401).json({ error: 'Autenticação inválida. E-mail ausente.' });

    const isAdmin = email === adminEmail;
    if (!isAdmin) {
        // 🔴 FUTURA INTEGRAÇÃO COM BANCO DE DADOS AQUI
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { 
        temperature: 0.15 // Frio e determinístico
      }
    });

    // 🔥 PROMPT HEDGE FUND: AUDITORIA VISUAL CORRIGIDA ("X" = "VS")
    const prompt = `Você é um Analista Quantitativo de Scout Pré-Live.
Sua missão é atuar como um Radar HFT: analisar a imagem de uma grade de jogos, ler as odds de vitória do Mandante e do Visitante e extrair EXCLUSIVAMENTE partidas que apresentem configurações estatísticas de EV+ (Expected Value Positivo).

🛑 REGRAS VISUAIS DA GRADE (MUITO IMPORTANTE):
Na imagem, a grade apresenta o layout com o nome dos times e suas respectivas odds de vitória nas pontas, separados por um "X" e alguns traços (Ex: 2.50 - X - 2.62). Este "X" significa apenas "Versus" (Time A x Time B) e NÃO É a odd de empate. Você deve extrair os dois números decimais visíveis (Mandante e Visitante).

🛑 REGRAS DE FILTRAGEM (DESCARTAR O QUE NÃO SE ENCAIXAR):
1. PADRÃO AMASSO (Foco em GOLS): Procure jogos onde exista um desajuste técnico absurdo. Um dos times (mandante ou visitante) deve ter uma odd de vitória igual ou inferior a @1.65 (Ex: 1.57, 1.50, 1.20). Isso indica jogo de ataque contra defesa.
2. PADRÃO EQUILÍBRIO (Foco em CANTOS): Procure jogos extremamente truncados e parelhos, onde as odds do mandante e do visitante estejam muito próximas, ambas acima de @2.20. (Ex: 2.50 x 2.62). Isso indica disputa ferrenha e alta tendência a escanteios.
3. ANTI-ALUCINAÇÃO: Se as duas odds (Mandante e Visitante) não estiverem legíveis, ignore o jogo.

Retorne ESTRITAMENTE um JSON válido neste formato exato:
{
  "matches": [
    {
      "time": "16:30",
      "teams": "Time A vs Time B",
      "matchOdds": "1.57 x 6.00",
      "market": "GOLS", 
      "reason": "A odd de @1.57 para o favorito indica um cenário de domínio territorial ('amasso'), favorecendo a exposição no mercado de Gols Totais ou Escanteios da Equipe."
    },
    {
      "time": "19:00",
      "teams": "Time C vs Time D",
      "matchOdds": "2.50 x 2.62",
      "market": "CANTOS",
      "reason": "Odds niveladas e altas em ambos os lados (@2.50 vs @2.62) sugerem um confronto tático intenso, propício para o mercado de Escanteios Totais da Partida."
    }
  ]
}`;

    const result = await model.generateContent([ prompt, { inlineData: { data: image, mimeType: mimeType || 'image/jpeg' } } ]);
    const responseText = result.response.text();

    const matchJson = responseText.match(/\{[\s\S]*\}/);
    if (!matchJson) throw new Error('A IA não conseguiu estruturar os dados da grade.');

    let json;
    try {
       json = JSON.parse(matchJson[0]);
    } catch {
       throw new Error('Falha no Parse dos dados da grade.');
    }

    // ==========================================
    // 🛡️ BACKEND AUDIT: SPREAD FILTER (A MÁGICA QUANTITATIVA)
    // ==========================================
    if (json.matches && Array.isArray(json.matches)) {
       const validatedMatches = json.matches.filter((match: any) => {
          const mkt = (match.market || '').toUpperCase();
          const oddsStr = match.matchOdds || '';
          
          // Extrai todos os números decimais da string de odds
          const oddsMatches = oddsStr.match(/\b\d+\.\d{2}\b/g);
          
          if (!oddsMatches || oddsMatches.length < 2) return true; // Deixa passar se não parsear direito (UX)
          
          const odds = oddsMatches.map((o: string) => parseFloat(o));
          const homeOdd = odds[0];
          const awayOdd = odds[odds.length - 1];
          const minOdd = Math.min(homeOdd, awayOdd);
          const spread = Math.abs(homeOdd - awayOdd); // Calcula a diferença real de forças
          
          if (mkt === 'GOLS') {
             // O Padrão Amasso exige que o super favorito tenha odd <= 1.65
             if (minOdd > 1.65) return false; 
          }
          
          if (mkt === 'CANTOS') {
             // O Padrão Equilíbrio exige odds iniciais altas E que o Spread (diferença) seja curto (<= 0.90)
             // Ex: 2.50 e 2.80 (Spread = 0.30 -> PASSA) | 2.20 e 3.50 (Spread = 1.30 -> CORTA)
             if (minOdd < 2.20 || spread > 0.90) return false;
          }

          return true; // Passou na auditoria quantitativa
       });

       json.matches = validatedMatches;
    }

    if (!isAdmin) {
        // 🔴 AQUI VOCÊ SOMA +1 NO BANCO DE DADOS DO USUÁRIO
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Grid:", error);
    return res.status(400).json({ error: error.message || 'Erro ao mapear a grade de jogos.' });
  }
}