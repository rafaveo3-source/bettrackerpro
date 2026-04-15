import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const maxDuration = 60;

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

    // 🔥 PROMPT BLINDADO: A IA agora atua como corretora do OCR e Antialucinação
    const tacticalPrompt = `Você é um analista quantitativo de apostas esportivas.
    O texto abaixo foi extraído de um print de apostas através de OCR. O texto perdeu a formatação visual e pode estar bagunçado.

    Sua missão é extrair os dados reais. SIGA ESTAS REGRAS OBRIGATORIAMENTE:
    
    1. BOOKMAKER: Identifique a casa de apostas pelo padrão (Ex: Betano usa "Criar Aposta", Bet365 usa "Retornos"). Responda APENAS o nome da casa (Ex: "Betano", "Bet365", "Betfair"). Se não souber, responda "Outra".
    2. ODD (Cotação): Encontre o multiplicador decimal do bilhete. NUNCA invente esse número. Se não achar, retorne 0.
    3. SELEÇÃO vs MERCADO (Atenção Betano): Na Betano, a SELEÇÃO (ex: "Sim", "Mais de 2.5") costuma vir separada do MERCADO (ex: "Ambas equipes Marcam"). Separe-os corretamente. Corrija nomes bizarros do OCR (ex: se o OCR leu "E emser se" no jogo Kremser, a seleção é "Kremser").
    4. STAKE (Exposição): Procure o valor financeiro apostado. Se o usuário cortou a imagem e a aposta não estiver no texto, RETORNE 0 OBRIGATORIAMENTE.
    5. STATUS: Se NÃO HOUVER palavra explícita como "Retorno", "Ganhos", "Encerrada" ou "Perdida", você DEVE OBRIGATORIAMENTE retornar o status como "pending".
    6. NUNCA USE OS VALORES DO MOLDE JSON COMO RESPOSTA. OS NÚMEROS DEVEM VIR EXCLUSIVAMENTE DO TEXTO OCR.

    Texto bruto extraído pelo OCR:
    """${textData}"""

    Retorne ESTRITAMENTE este formato JSON válido (Substitua os zeros e vazios pelos dados reais do texto OCR):
    {
      "bookmaker": "",
      "match": "",
      "market": "",
      "selection": "",
      "odd": 0.00,
      "stake": 0.00,
      "return": 0.00,
      "status": "pending" 
    }`;

    let aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let textResult = "";

    try {
        // TENTA GEMINI FLASH (Mais rápido e barato)
        const result = await aiModel.generateContent(tacticalPrompt);
        textResult = result.response.text();
    } catch (geminiError: any) { 
        try {
            // FALLBACK 1: GEMINI PRO
            aiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await aiModel.generateContent(tacticalPrompt);
            textResult = result.response.text();
        } catch (geminiProError: any) {
            // FALLBACK 2: OPENAI
            if (openai) {
                try {
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "system", content: "Retorne apenas JSON válido." }, { role: "user", content: tacticalPrompt }],
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    });
                    textResult = response.choices[0].message?.content || "";
                } catch (openaiError: any) {
                    throw new Error("Ambas as APIs de IA falharam.");
                }
            } else {
                throw new Error("A API do Google falhou e a chave da OpenAI não está configurada.");
            }
        }
    }
    
    // 🛡️ LIMPEZA E PARSER DO JSON
    textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) textResult = jsonMatch[0];
    
    const parsedData = JSON.parse(textResult);

    // Limpeza forçada dos números
    let rawOdd = String(parsedData.odd).replace(/[^\d.,]/g, '').replace(',', '.');
    let rawStake = String(parsedData.stake).replace(/[^\d.,]/g, '').replace(',', '.');
    let rawReturn = String(parsedData.return).replace(/[^\d.,]/g, '').replace(',', '.');
    
    // Fallback é 0. Assim o frontend entende que a IA não achou e acende o alerta amarelo
    const odd = parseFloat(rawOdd) || 0; 
    const stake = parseFloat(rawStake) || 0; 
    const totalReturn = parseFloat(rawReturn) || 0;
    let profit = 0;

    if (parsedData.status === 'won') {
        profit = totalReturn > 0 ? (totalReturn - stake) : (stake * odd) - stake;
    } else if (parsedData.status === 'lost') {
        profit = -stake;
    } else if (parsedData.status === 'half_won' || parsedData.status === 'half_lost' || parsedData.status === 'cashout') {
        profit = totalReturn - stake; 
    }

    const finalData = {
        bookmaker: parsedData.bookmaker || "Outra",
        match: parsedData.match || "",
        market: parsedData.market || "",
        selection: parsedData.selection || "",
        odd: parseFloat(odd.toFixed(2)),
        stake: stake,
        return: totalReturn,
        profit: parseFloat(profit.toFixed(2)),
        status: parsedData.status || "pending"
    };

    return res.status(200).json(finalData);

  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Erro ao processar dados da IA.' });
  }
}