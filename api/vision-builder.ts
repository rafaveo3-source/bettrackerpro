import { GoogleGenerativeAI } from '@google/generative-ai';

// 🔥 Aumenta o tempo limite da Vercel para 60 segundos
export const maxDuration = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { images, email, markets } = req.body; 
    
    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(400).json({ error: 'Autenticação inválida. E-mail ausente.' });

    const isAdmin = email === adminEmail;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.1, // Zero criatividade, 100% obediência matemática
        }
    });

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    // 🔥 SUPER PROMPT V8: POISSON, COVARIÂNCIA, E ESCALA DE LINHAS ALTERNATIVAS (SEM ASIÁTICOS)
    const prompt = `Você é um Analista Quantitativo HFT de Elite e Gestor de Risco Esportivo.
    Sua missão é criar uma Aposta Combinada (Múltipla) lendo as imagens estatísticas fornecidas.

    🎯 SUA META DE ODD E PROBABILIDADE (INVIOLÁVEL):
    A Odd Justa Final do seu bilhete deve ficar EXATAMENTE entre @1.60 e @2.00. 
    Para isso, ajuste as linhas para encontrar eventos individuais com probabilidade de acerto entre 75% e 82%. NUNCA pegue eventos óbvios demais (95%+), pois destroem a precificação.

    ⚙️ MOTOR MATEMÁTICO E TÁTICO OBRIGATÓRIO (APLIQUE ESTAS 3 REGRAS):
    1. DISTRIBUIÇÃO DE POISSON E CONSTÂNCIA: Ignore "Médias" puras (ex: média de 10 cantos por jogo), pois médias são manipuladas por outliers. Olhe EXCLUSIVAMENTE para a Constância / Taxa de Acerto (Hit Rate %). Só selecione uma linha se o time a bate de forma consistente (Acima de 75% nos últimos 10 jogos).
    
    2. COVARIÂNCIA (CORRELAÇÃO DE EVENTOS): Entenda o "Game Script". Se um time é super favorito ou perdeu a primeira partida, ele terá domínio de campo (Field Tilt > 65%). Nesse caso, apostas de "Gols" e "Cantos a favor do Favorito" têm correlação positiva.
    
    3. PIOR CENÁRIO DE ESCANTEIOS (ARMADILHA DA LETALIDADE): Muito cuidado ao sugerir "Mais de Cantos". Se as estatísticas mostrarem que um time faz muitos gols (Alta Letalidade) ou converte ataques em gols muito rápido, EVITE apostar no Overs de Escanteios desse jogo. Se o time fizer 2x0 cedo, o jogo morre e os escanteios desaparecem. Só sugira "Over Cantos" para times com muito volume de ataque, mas que sofrem para finalizar.

    ⚠️ FIREWALL DE MERCADOS E PROTEÇÃO DE MÚLTIPLAS (BET365 COMPLIANCE):
    - É PROIBIDO usar Resultado (1x2), Cartões, Vencedor ou Jogadores.
    - Use APENAS variações de: [ ${selectedMarketsStr} ].
    - É ESTRITAMENTE PROIBIDO usar Linhas Asiáticas (como +1.0 Gols ou +8.0 Cantos) porque as casas de apostas bloqueiam isso em Múltiplas. 
    - Para a chave "conservativeCombination", você deve aplicar o "Fractional Drop". Reduza as linhas decimais ao máximo suportado pelas estatísticas. Exemplo: Se a recomendação principal for "Mais de 1.5 Gols", a conservadora DEVE ser "Mais de 0.5 Gols". Se a principal for "Mais de 8.5 Cantos", a conservadora DEVE ser "Mais de 6.5 Cantos".

    Retorne ESTRITAMENTE um JSON válido neste formato exato (sem \`\`\`json ou markdown):
    {
      "selections": [
        {
          "match": "Time A vs Time B",
          "market": "Time da Casa (HT) - Mais de 2.5 Escanteios",
          "prob": 78
        }
      ],
      "alternativeCombination": "Sugestão alternativa focada em Gols ou Cantos dentro do padrão permitido.",
      "conservativeCombination": "Versão super segura aplicando o Fractional Drop (ex: Menos linhas fracionadas, Mais de 0.5 Gols, Mais de 6.5 Cantos). Sem uso de asiáticos.",
      "analysis": "Sua tese em tópicos:\\n• Aplicação de Poisson/Hit Rate: [sua análise da constância]\\n• Correlação e Letalidade: [sua análise do cenário do jogo e por que fugiu do pior cenário]\\n• Enquadramento da Odd: [como isso gera a odd alvo]."
    }`;

    const imageParts = images.map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    let responseText = result.response.text();

    // 🛡️ Extrator de JSON blindado
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('A IA não conseguiu formatar os dados. Tente novamente.');
    
    let json;
    try {
        json = JSON.parse(match[0]);
    } catch (e) {
        throw new Error('Falha na conversão dos dados matemáticos.');
    }
    
    // 🧮 CÁLCULO DE ODD JUSTA CROSS-MATCH (Matemática pura no Backend com Number Fallback)
    if (json.selections && json.selections.length > 0) {
        const combinedProbDecimal = json.selections.reduce((acc: number, curr: any) => acc * ((Number(curr.prob) || 78) / 100), 1);
        json.combinedProb = Math.round(combinedProbDecimal * 100);
        json.fairOdd = Number((1 / combinedProbDecimal).toFixed(2));
    } else {
        throw new Error('Não foi possível extrair seleções válidas com as regras informadas.');
    }

    if (!isAdmin) {
       // Banco de Dados Futuro
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(400).json({ error: error.message || 'Erro ao processar as múltiplas cruzadas.' });
  }
}