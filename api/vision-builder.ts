import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(400).json({ error: 'Autenticação inválida. E-mail ausente.' });

    // 🛡️ GATEKEEPER DE SEGURANÇA (BANCO DE DADOS)
    const isAdmin = email === adminEmail;
    if (!isAdmin) {
        // Exemplo de trava Supabase:
        // const { data } = await supabase.from('users').select('scans_today').eq('email', email).single();
        // if (data && data.scans_today >= 10) return res.status(403).json({ error: 'Limite diário atingido.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 🔥 NOVO PROMPT: EXPLORA TODOS OS MERCADOS E CRIA MÚLTIPLAS
    const prompt = `Você é um Algoritmo Precificador (Bookmaker) Pré-Live Especialista em 'Criar Aposta' e Múltiplas.
    Você receberá uma ou mais imagens contendo estatísticas pré-jogo de futebol.
    
    ESTRATÉGIA:
    Sua missão é analisar os dados e construir a APOSTA COMBINADA (Múltipla) perfeita, selecionando os mercados matematicamente mais seguros baseados no histórico mostrado.
    
    MERCADOS QUE VOCÊ PODE EXPLORAR (Baseado na Bet365):
    - Gols (Total de Gols, Ambas Marcam, Gols no 1º Tempo)
    - Escanteios (Total de Escanteios, Escanteios 1º Tempo, Escanteios do Time)
    - Cartões (Total de Cartões, Cartão Vermelho)
    - Jogadores (Finalizações, Chutes ao Gol)
    - Resultado (1x2, Dupla Chance, Empate Anula Aposta)

    Você DEVE sugerir quantas seleções forem necessárias (2, 3, 4 ou mais) de forma que a probabilidade matemática combinada gere uma Odd Justa (Fair Line) final entre @1.60 e @2.00.

    Retorne APENAS um JSON válido neste formato exato (sem markdown):
    {
      "selections": [
        {
          "match": "Nome do Jogo",
          "market": "Mercado Escolhido (ex: Norwich Mais de 4.5 Escanteios)",
          "prob": 85
        },
        {
          "match": "Nome do Jogo",
          "market": "Mercado Escolhido (ex: Ambas Equipes Marcam - Sim)",
          "prob": 72
        }
      ],
      "analysis": "Sua tese quantitativa detalhada do porquê essa combinação tem altíssimo valor (EV+)."
    }`;

    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);

    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const start = responseText.indexOf('{'); const end = responseText.lastIndexOf('}');
    if (start !== -1 && end !== -1) responseText = responseText.substring(start, end + 1);

    const json = JSON.parse(responseText);
    
    // Calcula a probabilidade combinada e Odd Justa dinamicamente
    if (json.selections && json.selections.length > 0) {
        const combinedProbDecimal = json.selections.reduce((acc: number, curr: any) => acc * (curr.prob / 100), 1);
        json.combinedProb = Math.round(combinedProbDecimal * 100);
        json.fairOdd = Number((1 / combinedProbDecimal).toFixed(2));
    }

    if (!isAdmin) {
       // 🔴 AQUI VOCÊ SOMA +1 NO BANCO DE DADOS DO USUÁRIO
       // await supabase.rpc('increment_scan_count', { user_email: email });
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(500).json({ error: 'Erro ao construir a aposta.' });
  }
}