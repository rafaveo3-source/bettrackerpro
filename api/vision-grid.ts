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
        // 🔴 FUTURA INTEGRAÇÃO COM BANCO DE DADOS AQUI (Ex: Checar limite mensal extra)
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { 
        temperature: 0.15 // Frio e determinístico para extração de grade
      }
    });

    // 🔥 PROMPT HEDGE FUND: AUDITORIA VISUAL E SELEÇÃO DE ASSIMETRIAS
    const prompt = `Você é um Analista Quantitativo de Scout Pré-Live.
Sua missão é atuar como um Radar HFT: analisar a imagem de uma grade de jogos, ler as odds do mercado Resultado Final (1x2) e extrair EXCLUSIVAMENTE partidas que apresentem configurações estatísticas de EV+ (Expected Value Positivo) com base nas heurísticas abaixo.

🛑 REGRAS DE FILTRAGEM (DESCARTAR O QUE NÃO SE ENCAIXAR):
1. PADRÃO AMASSO (Foco em GOLS): Procure jogos onde exista um desajuste técnico absurdo. Um dos times (mandante ou visitante) deve ter uma odd de vitória igual ou inferior a @1.55. Isso indica jogo de ataque contra defesa.
2. PADRÃO EQUILÍBRIO (Foco em CANTOS): Procure jogos extremamente truncados e parelhos, onde as odds do mandante e do visitante estejam muito próximas (Ambas entre @2.30 e @2.90). Isso indica disputa ferrenha e alta tendência a escanteios e laterais.
3. ANTI-ALUCINAÇÃO: Se as odds (1x2) do jogo não estiverem visíveis na imagem, você DEVE ignorar esse jogo. Não dedua e não invente partidas.

Na chave "reason", escreva como um analista institucional (tom frio, técnico, focado em assimetria e controle de jogo).

Retorne ESTRITAMENTE um JSON válido neste formato exato (sem formatação markdown adicional):
{
  "matches": [
    {
      "time": "16:30",
      "teams": "Time A vs Time B",
      "odds1x2": "1.45 - 4.50 - 7.00",
      "market": "GOLS", 
      "reason": "A odd de @1.45 indica um cenário de domínio territorial ('amasso'), favorecendo a exposição no mercado de Gols Totais ou Escanteios do favorito."
    },
    {
      "time": "19:00",
      "teams": "Time C vs Time D",
      "odds1x2": "2.50 - 3.10 - 2.62",
      "market": "CANTOS",
      "reason": "Odds niveladas (@2.50 vs @2.62) sugerem um confronto tático de alta intensidade pelo meio campo, propício para o mercado de Escanteios Totais."
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
    // 🛡️ BACKEND AUDIT: FILTRO HEURÍSTICO
    // Garante que a IA não inventou um EV+ fantasma
    // ==========================================
    if (json.matches && Array.isArray(json.matches)) {
       const validatedMatches = json.matches.filter((match: any) => {
          const mkt = (match.market || '').toUpperCase();
          const oddsStr = match.odds1x2 || '';
          
          // Extrai todos os números flutuantes da string de odds
          const oddsMatches = oddsStr.match(/\b\d+\.\d{2}\b/g);
          
          if (!oddsMatches || oddsMatches.length < 2) return true; // Se não conseguir parsear direito, deixa passar por segurança de UX
          
          const odds = oddsMatches.map((o: string) => parseFloat(o));
          const minOdd = Math.min(...odds);
          
          if (mkt === 'GOLS') {
             // O Padrão Amasso exige que o super favorito tenha odd <= 1.60 (Margem de tolerância do backend)
             if (minOdd > 1.60) return false; 
          }
          
          if (mkt === 'CANTOS') {
             // O Padrão Equilíbrio exige que a menor odd (mandante ou visitante) não seja inferior a 2.10
             // Ex: 2.20 x 3.00 (Aceitável). 1.80 x 4.00 (Rejeitado, não é tão equilibrado)
             if (minOdd < 2.10) return false;
          }

          return true; // Passou na auditoria
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