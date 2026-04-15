import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

// 🔥 PROMPTS TÁTICOS (Focados em não inventar valores)
const specializedPrompts = {
    'Bet365': (text: string) => `O texto é da Bet365. REGRA: A ODD é um número decimal. A STAKE é o valor numérico exato após 'Aposta' ou 'R$' (Ex: se o texto diz R$5,00, a stake é 5.00). A SELEÇÃO é o palpite apostado. Texto OCR: """${text}"""`,
    'Betano': (text: string) => `O texto é da Betano. REGRA: A ODD pode estar fragmentada (ex: 1 . 8 3 = 1.83). A STAKE é o valor exato após 'Aposta' ou 'R$'. A SELEÇÃO é o palpite apostado. Texto OCR: """${text}"""`,
    'Betfair': (text: string) => `O texto é da Betfair. A ODD costuma ter um @ antes. A STAKE é o valor exato apostado. A SELEÇÃO é o palpite apostado. Texto OCR: """${text}"""`,
    'Outra': (text: string) => `Extraia Jogo (Apenas Letras), Mercado, Seleção, Odd (Apenas decimal) e Stake (Valor apostado exato) deste texto. Texto OCR: """${text}"""`
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { textData } = req.body; 
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey) return res.status(500).json({ error: 'Chave Gemini ausente.' });
    if (!textData || textData.trim().length < 5) return res.status(400).json({ error: 'Texto insuficiente.' });

    const genAI = new GoogleGenerativeAI(geminiKey);
    const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

    let aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let bookmaker = "Outra";
    try {
        const classificationResult = await aiModel.generateContent(`Diga apenas o nome da casa de aposta (Bet365, Betano ou Betfair). Se não souber, diga 'Outra'. Texto: """${textData}"""`);
        bookmaker = classificationResult.response.text().trim().replace(/['"`]/g, '');
    } catch (e) { }

    const promptStrategy = specializedPrompts[bookmaker as keyof typeof specializedPrompts] || specializedPrompts['Outra'];
    
    // 🔥 PROMPT BLINDADO: Ordem explícita para não inventar o 100.00
    const tacticalPrompt = promptStrategy(textData) + `\n\nATENÇÃO: Não invente valores! Extraia o número real do texto. Se a aposta for R$ 5,00, a stake é 5.00. Junte números fragmentados. 
Retorne ESTRITAMENTE este JSON:
{
  "bookmaker": "${bookmaker}",
  "match": "Time A vs Time B",
  "market": "Resultado Final",
  "selection": "Palpite",
  "odd": 1.85,
  "stake": 5.00,
  "return": 9.25,
  "status": "won"
}`;

    let textResult = "";

    try {
        const result = await aiModel.generateContent(tacticalPrompt);
        textResult = result.response.text();
    } catch (geminiError: any) { 
        try {
            aiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await aiModel.generateContent(tacticalPrompt);
            textResult = result.response.text();
        } catch (geminiProError: any) {
            if (openai) {
                try {
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: tacticalPrompt }],
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    });
                    textResult = response.choices[0].message?.content || "";
                } catch (openaiError: any) { throw new Error("Ambas as APIs falharam."); }
            } else { throw new Error("A API falhou."); }
        }
    }
    
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