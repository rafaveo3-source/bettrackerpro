import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

// 🔥 PROMPTS TÁTICOS (Agora focados em ler OCR fragmentado e extrair a SELEÇÃO)
// 🔥 PROMPTS TÁTICOS (Blindagem contra mistura de dados)
const specializedPrompts = {
    'Bet365': (text: string) => `O texto é da Bet365. 
REGRA 1: O JOGO (match) é composto apenas por letras (Ex: Time A x Time B). Ignore números decimais aqui.
REGRA 2: A SELEÇÃO é o palpite apostado (Ex: Kremser SC, Mais de 2.5). 
REGRA 3: A ODD é SEMPRE um número decimal (Ex: 1.83). Se estiver ao lado do nome do time, separe.
REGRA 4: A STAKE é o 'Valor' ou 'Aposta'.
Texto OCR: """${text}"""`,
    
    'Betano': (text: string) => `O texto é da Betano. A ODD pode estar fragmentada (ex: 1 . 8 3 = 1.83). A STAKE é o valor após 'Aposta'. A SELEÇÃO é o palpite. Texto OCR: """${text}"""`,
    
    'Betfair': (text: string) => `O texto é da Betfair. A ODD costuma ter um @ antes. A SELEÇÃO é o nome do time ou palpite apostado. Texto OCR: """${text}"""`,
    
    'Outra': (text: string) => `Extraia Jogo (Apenas Letras), Mercado, Seleção (Palpite exato), Odd (Apenas decimal) e Stake deste texto. Texto OCR: """${text}"""`
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { textData } = req.body; 
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente no servidor.' });
    if (!textData || textData.trim().length < 5) return res.status(400).json({ error: 'Texto insuficiente enviado pelo OCR.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    // 🚀 PASSO 1: CLASSIFICAR A CASA (Usando gemini-1.5-flash, sem travas de MIME para evitar 404)
    let aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let bookmaker = "Outra";
    try {
        const classificationPrompt = `Diga apenas o nome da casa de aposta (Bet365, Betano ou Betfair). Se não souber, diga 'Outra'. Texto: """${textData}"""`;
        const classificationResult = await aiModel.generateContent(classificationPrompt);
        bookmaker = classificationResult.response.text().trim().replace(/['"`]/g, '');
    } catch (e) {
        // Ignora erro na classificação e assume 'Outra'
    }

    // 🚀 PASSO 2: EXECUTAR PROMPT TÁTICO
    const promptStrategy = specializedPrompts[bookmaker as keyof typeof specializedPrompts] || specializedPrompts['Outra'];
    const tacticalPrompt = promptStrategy(textData) + `\n\nJunte números fragmentados (ex: 1 . 8 3 vira 1.83). Retorne ESTRITAMENTE este JSON:
{
  "bookmaker": "${bookmaker}",
  "match": "Time A vs Time B",
  "market": "Resultado Final",
  "selection": "Kremser SC",
  "odd": 1.85,
  "stake": 100.00,
  "return": 185.00,
  "status": "won"
}`;

    let textResult = "";

    try {
        // TENTA GEMINI FLASH
        const result = await aiModel.generateContent(tacticalPrompt);
        textResult = result.response.text();
    } catch (geminiError: any) { 
        try {
            // FALLBACK 1: TENTA GEMINI PRO (Modelos antigos de SDK suportam esse)
            aiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await aiModel.generateContent(tacticalPrompt);
            textResult = result.response.text();
        } catch (geminiProError: any) {
            // FALLBACK 2: OPENAI (Se configurada)
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
                    throw new Error("Ambas as APIs falharam.");
                }
            } else {
                throw new Error("A API do Google falhou e a chave da OpenAI não está configurada.");
            }
        }
    }
    
    // Limpa a resposta da IA (Blindagem de JSON)
    textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) textResult = jsonMatch[0];
    
    const parsedData = JSON.parse(textResult);

    let profit = 0;
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
    }

    parsedData.profit = parseFloat(profit.toFixed(2));
    parsedData.odd = parseFloat(String(parsedData.odd).replace(/\s/g, '').replace(',', '.')) || 1; 
    parsedData.stake = stake;
    parsedData.return = totalReturn;
    parsedData.selection = parsedData.selection || "";

    return res.status(200).json(parsedData);

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao processar dados.' });
  }
}