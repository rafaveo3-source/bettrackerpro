import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    // Proteção de origem (Descomente em produção)
    // if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { textData } = req.body; 
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente no servidor.' });
    if (!textData || textData.trim().length < 10) return res.status(400).json({ error: 'Texto insuficiente enviado pelo OCR.' });

    // Usamos o Flash (Rápido e Barato)
    const genAI = new GoogleGenerativeAI(geminiKey);
    const aiModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    });

    const prompt = `Você é um Analista de Dados de Apostas. O texto abaixo foi extraído por OCR de um print de um bilhete de aposta esportiva (provavelmente Bet365, Betano ou Betfair). O texto está sujo e desestruturado.
Sua missão é entender o contexto e organizar os dados.

TEXTO EXTRAÍDO DO OCR:
"""
${textData}
"""

REGRAS DE EXTRAÇÃO:
1. bookmaker: Tente identificar a casa (Bet365, Betano, Betfair). Se não achar, retorne "Outra".
2. match: O confronto (Ex: "Flamengo x Palmeiras"). Se houver "v", "vs", "-", substitua por " x ".
3. market: O mercado apostado (Ex: "Over 2.5 Gols", "Escanteios Mais de 9", "Vencedor do Encontro").
4. odd: A cotação decimal (Ex: 1.85). Se achar "," transforme em ".".
5. stake: O valor investido na aposta (Apenas o número, sem R$ ou $).
6. return: O valor total de retorno (Ganhos Potenciais ou Retorno). Apenas o número.
7. status: Avalie palavras como "Ganha", "Vencedora", "Resolvida", "Pago" (Retorne "won"). Palavras como "Perdida", "Perdedora" (Retorne "lost"). Palavras como "Devolvida", "Reembolsada", "Anulada" (Retorne "refunded"). Se "Encerrar Aposta" com lucro (Retorne "half_won") ou prejuízo (Retorne "half_lost"). Se não conseguir determinar o resultado final, retorne "pending".

Retorne ESTRITAMENTE este JSON:
{
  "bookmaker": "Bet365",
  "match": "Real Madrid x Barcelona",
  "market": "Mais de 2.5 Gols",
  "odd": 1.85,
  "stake": 100.00,
  "return": 185.00,
  "status": "won"
}`;

    const result = await aiModel.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    let textResult = result.response.text();
    
    // Limpa a resposta da IA (Blindagem de JSON)
    textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) textResult = jsonMatch[0];
    
    const parsedData = JSON.parse(textResult);

    // Calcula o lucro líquido com base no status e valores
    let profit = 0;
    const stake = parseFloat(parsedData.stake) || 0;
    const totalReturn = parseFloat(parsedData.return) || 0;

    if (parsedData.status === 'won') {
        profit = totalReturn > 0 ? (totalReturn - stake) : (stake * parseFloat(parsedData.odd)) - stake;
    } else if (parsedData.status === 'lost') {
        profit = -stake;
    } else if (parsedData.status === 'half_won' || parsedData.status === 'half_lost') {
        profit = totalReturn - stake; // Se deu cashout, o retorno menos a stake é o lucro/prejuízo real
    }

    parsedData.profit = parseFloat(profit.toFixed(2));
    
    // Tratamento de segurança para números
    parsedData.odd = parseFloat(parsedData.odd) || 1;
    parsedData.stake = stake;

    return res.status(200).json(parsedData);

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao formatar os dados do bilhete.' });
  }
}