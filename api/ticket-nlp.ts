import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

// 🔥 PROMPTS TÁTICOS ESPECILIZADOS POR CASA DE APOSTA 🔥
const specializedPrompts = {
    'Bet365': (text: string) => `O texto abaixo é da Bet365. Encontre a Odd após 'Odd' ou 'Cotação'. Encontre a Stake após 'Aposta Total' ou 'Total Apostado'. Encontre o Resultado após 'Vencida' ou 'Perdida'. Encontre o Jogo perto do topo. Texto: """${text}"""`,
    'Betano': (text: string) => `O texto abaixo é da Betano. Encontre a Odd após '@'. Encontre a Stake após 'Valor Apostado' ou 'Aposta'. Encontre o Resultado após 'Vencida' ou 'Ganha'. Encontre o Jogo na linha do evento. Texto: """${text}"""`,
    'Betfair': (text: string) => `O texto abaixo é da Betfair. Encontre a Odd após '@' ou 'Odd'. Encontre a Stake após 'Apostar' ou 'Total Apostado'. Encontre o Resultado após 'Ganhos' ou 'Perdas'. Encontre o Jogo no cabeçalho. Texto: """${text}"""`,
    'Outra': (text: string) => `Tente extrair Jogo, Mercado, Odd, Stake, Retorno e Resultado deste texto genérico de aposta. Texto: """${text}"""`
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production' && (!origin || !origin.includes('bettrackerpro.com.br'))) return res.status(403).json({ error: 'Acesso negado.' });

    const { textData } = req.body; 
    
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente no servidor.' });
    if (!textData || textData.trim().length < 5) return res.status(400).json({ error: 'Texto insuficiente enviado pelo OCR.' });

    // Instancia o Google Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest', generationConfig: { temperature: 0.1, responseMimeType: "application/json" } });

    // Instancia a OpenAI como Plano B
    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    // 🚀 PASSO 1: CLASSICAR A CASA DE APOSTA (Muito Rápido)
    const classificationPrompt = `Analise este texto bruto de um bilhete de aposta e diga apenas qual é a casa (Bet365, Betano ou Betfair). Se não conseguir, diga 'Outra'. Texto: """${textData}"""`;
    const classificationResult = await aiModel.generateContent(classificationPrompt);
    const bookmaker = classificationResult.response.text().trim().replace(/['"`]/g, ''); // Limpa aspas

    // 🚀 PASSO 2: EXECUTAR PROMPT TÁTICO ESPECIALIZADO
    const promptStrategy = specializedPrompts[bookmaker as keyof typeof specializedPrompts] || specializedPrompts['Outra'];
    const tacticalPrompt = promptStrategy(textData) + `\n\nRetorne ESTRITAMENTE este JSON:
{
  "bookmaker": "${bookmaker}",
  "match": "Time A vs Time B",
  "market": "Over 2.5",
  "odd": 1.85,
  "stake": 100.00,
  "return": 185.00,
  "status": "won"
}`;

    let textResult = "";

    try {
        // TENTA PRIMEIRO COM O GEMINI
        const result = await aiModel.generateContent({ contents: [{ role: "user", parts: [{ text: tacticalPrompt }] }] });
        textResult = result.response.text();
    } catch (geminiError: any) { 
        // SE O GEMINI FALHAR (Ex: erro 404), ACIONA A OPENAI AUTOMATICAMENTE
        if (openai) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: tacticalPrompt }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                });
                textResult = response.choices[0].message?.content || "";
            } catch (openaiError: any) {
                throw new Error("Ambas as APIs de Inteligência Artificial falharam.");
            }
        } else {
            throw new Error("Falha na API da IA (Gemini): " + geminiError.message);
        }
    }
    
    // Limpa a resposta da IA (Blindagem de JSON)
    textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) textResult = jsonMatch[0];
    
    const parsedData = JSON.parse(textResult);

    // Calcula o lucro líquido com base no status e valores
    let profit = 0;
    // Tenta limpar possíveis moedas (R$, $, etc.) antes de converter
    let stakeStr = String(parsedData.stake).replace(/[^\d.,]/g, '').replace(',', '.');
    let returnStr = String(parsedData.return).replace(/[^\d.,]/g, '').replace(',', '.');
    
    const stake = parseFloat(stakeStr) || 0;
    const totalReturn = parseFloat(returnStr) || 0;

    if (parsedData.status === 'won') {
        profit = totalReturn > 0 ? (totalReturn - stake) : (stake * parseFloat(parsedData.odd)) - stake;
    } else if (parsedData.status === 'lost') {
        profit = -stake;
    } else if (parsedData.status === 'half_won' || parsedData.status === 'half_lost' || parsedData.status === 'cashout') {
        profit = totalReturn - stake; 
    } else {
        profit = 0;
    }

    parsedData.profit = parseFloat(profit.toFixed(2));
    parsedData.odd = parseFloat(String(parsedData.odd).replace(',', '.')) || 1; // Limpa vírgula
    parsedData.stake = stake;
    parsedData.return = totalReturn;

    return res.status(200).json(parsedData);

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao formatar os dados do bilhete.' });
  }
}