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

    // 🔥 PROMPT BLINDADO: A IA agora atua como corretora do OCR
    const tacticalPrompt = `Você é um analista quantitativo de apostas esportivas.
    O texto abaixo foi extraído de um print de apostas através de OCR (Reconhecimento Óptico de Caracteres).
    O OCR comete MUITOS erros porque tenta ler ícones (como camisas de times) como se fossem letras, e quebra números decimais.
    
    Sua missão é atuar como um filtro inteligente, deduzir o contexto real e limpar os dados.

    REGRAS DE OURO (SIGA ESTRITAMENTE):
    1. SELEÇÃO (Palpite): Corrija nomes bizarros. Se o OCR leu "E emser se" ou algo ilegível, mas o jogo for "Kremser SC vs Neusiedl", a seleção apostada é "Kremser SC".
    2. ODD (Cotação): O OCR costuma espaçar números. Se você ler "1 . 83", "1, 83" ou apenas "1" e um "83" perdido, a odd real é 1.83.
    3. STAKE (Exposição): Encontre o valor após "Aposta", "Valor" ou "R$". NUNCA invente valores de exemplo.
    4. STATUS: O OCR NÃO ENXERGA ÍCONES DE CHECK (✅) OU CRUZ (❌). Portanto, se NÃO HOUVER a palavra explícita "Retorno", "Ganhos", "Encerrada" ou "Perdida" no texto, você DEVE OBRIGATORIAMENTE retornar o status como "pending" (Em Aberto). Não tente adivinhar.

    Texto bruto extraído pelo OCR:
    """${textData}"""

    Retorne ESTRITAMENTE este JSON válido (sem formatação markdown, apenas o JSON puro):
    {
      "bookmaker": "Bet365 ou Betano ou Betfair ou Outra",
      "match": "Time A vs Time B",
      "market": "Mercado (ex: Resultado Final)",
      "selection": "Palpite corrigido",
      "odd": 1.83,
      "stake": 5.00,
      "return": 0.00,
      "status": "pending" 
    }`;

    let aiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let textResult = "";

    try {
        // TENTA GEMINI FLASH (Em apenas 1 passo para ser mais rápido)
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
    
    // 🛡️ BLINDAGEM DE PARSER DO JSON E LIMPEZA DE CARACTERES LIXO
    textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) textResult = jsonMatch[0];
    
    const parsedData = JSON.parse(textResult);

    // Limpeza forçada dos números para garantir que o Javascript não corte a Odd
    let rawOdd = String(parsedData.odd).replace(/[^\d.,]/g, '').replace(',', '.');
    let rawStake = String(parsedData.stake).replace(/[^\d.,]/g, '').replace(',', '.');
    let rawReturn = String(parsedData.return).replace(/[^\d.,]/g, '').replace(',', '.');
    
    const odd = parseFloat(rawOdd) || 1;
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

    // Reconstruindo o JSON de forma blindada
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