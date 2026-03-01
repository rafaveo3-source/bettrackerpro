import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// 🔥 MOTOR DE VOLATILIDADE DE MERCADO (VOLATILITY MULTIPLIER)
const getMarketVolatilityPenalty = (market: string) => {
  const m = market.toLowerCase();

  // Nível 1: Volatilidade Extrema (Punição Forte)
  if (m.includes('1º tempo') || m.includes('1o tempo') || m.includes('(ht)') || m.includes('primeiro tempo')) {
      if (m.includes('escanteios') || m.includes('cantos') || m.includes('race')) return 0.92; 
      return 0.95; 
  }
  
  // Nível 2: Volatilidade Alta (Punição Moderada)
  if (m.includes('ambos') || m.includes('btts')) return 0.96;
  if (m.includes('race')) return 0.96;
  
  // Nível 3: Volatilidade Média (Punição Leve)
  if (m.includes('escanteios') || m.includes('cantos')) return 0.97;
  
  // Nível 4: Volatilidade Baixa (Quase sem punição)
  if (m.includes('gols') || m.includes('gol')) return 0.98;

  // Seguro (Padrão)
  return 1;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 🛡️ ESCUDO 1: PROTEÇÃO DE ORIGEM (CORS ADAPTADO PARA VERCEL)
    const origin = req.headers.origin || req.headers.referer || '';
    
    if (process.env.NODE_ENV === 'production') {
      if (origin && !origin.includes('bettrackerpro.com.br')) {
        console.warn(`Tentativa de acesso bloqueada (Origem externa não autorizada): ${origin}`);
        return res.status(403).json({ error: 'Acesso negado. Endpoint protegido.' });
      }
    } else {
      if (origin && !origin.includes('localhost') && !origin.includes('bettrackerpro.com.br')) {
        return res.status(403).json({ error: 'Acesso negado no ambiente de teste.' });
      }
    }

    const { images, email, markets } = req.body; 
    
    const apiKey = process.env.GEMINI_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(401).json({ error: 'Acesso não autorizado. Identificação ausente.' });

    const isAdmin = email === adminEmail;

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        // 🔥 Mantido em 0.2: Deterministico e preciso, mas com espaço de busca ampliado no prompt.
        temperature: 0.2, 
      },
    });

    const selectedMarketsStr =
      markets && markets.length > 0
        ? markets.join(', ')
        : 'Gols, Escanteios';

    // 🔥 PROMPT BLINDADO: ANTI-ALUCINAÇÃO, UX TÉCNICA E REGRAS ESTRUTURAIS
    const prompt = `Você é um Analista Quantitativo HFT de Elite e Gestor de Risco Esportivo.
Sua missão é criar uma Aposta Combinada (Múltipla) lendo as imagens estatísticas fornecidas.

🎯 SUA META DE ODD E PROBABILIDADE:
A Odd Justa Final do seu bilhete deve ficar IDEALMENTE entre @1.60 e @2.00, podendo variar até @2.20 caso a estrutura estatística justifique o valor.
Para atingir isso com segurança matemática, construa OBRIGATORIAMENTE uma DUPLA (Apenas 2 seleções). Evite triplas.
Priorize linhas com probabilidade de acerto (Hit Rate) entre 72% e 80%, mas é PERMITIDO flexibilizar utilizando linhas entre 65% e 85% caso isso gere um melhor enquadramento estrutural da odd final.

⚙️ MOTOR MATEMÁTICO E TÁTICO:
1. LEITURA RESTRITA DE DADOS (ANTI-ALUCINAÇÃO): É EXPRESSAMENTE PROIBIDO estimar, calcular por conta própria ou inferir números que não estejam claramente visíveis nas imagens. Se a probabilidade (%) de um mercado não estiver explícita no gráfico, NÃO o utilize. Use exclusivamente o Hit Rate real (%) visível.
2. TAMANHO DA AMOSTRA: Analise visualmente a quantidade de jogos utilizados (Ex: últimos 5, 10 ou 20 jogos). Retorne EXATAMENTE este número inteiro na chave "sampleSize".
3. COVARIÂNCIA E BOM SENSO: Evite overs de escanteios se houver alta eficiência ofensiva (letalidade alta = jogo acaba cedo).

⚠️ REGRAS DE ESTRUTURAÇÃO DO BILHETE (MUITO IMPORTANTE):
- Proibido Resultado Final (1x2), Cartões, Jogadores e Linhas Asiáticas (Use finais .5).
- Use apenas variações de: [ ${selectedMarketsStr} ].
- 🛑 REGRA DE ESTRUTURAÇÃO (ANTI-REDUNDÂNCIA): Priorize o cruzamento de mercados diferentes (Ex: 1 de Gols + 1 de Escanteios) para evitar bloqueios de casas de apostas. Exceção: É permitido usar duas linhas do mesmo mercado APENAS se forem de naturezas cronológicas diferentes (Ex: Mais de 0.5 Gols HT cruzado com Mais de 2.5 Gols FT). Em NENHUMA hipótese combine "Mercado do Time" com "Mercado da Partida" na mesma categoria (Ex: Jamais faça "Mais 1.5 Gols Emelec" + "Mais 1.5 Gols Partida").
- Na "alternativeCombination", você DEVE propor uma aposta com mercado e abordagem totalmente DIFERENTES do bilhete principal.
- Na "conservativeCombination", aplique o "Fractional Drop" reduzindo as linhas obrigatoriamente para extrema segurança.

⚠️ REGRAS DE FORMATAÇÃO DE TEXTO E UX (LEIA COM ATENÇÃO):
Nas chaves "alternativeCombination", "conservativeCombination" e "analysis", VOCÊ DEVE ESCREVER TEXTO COMUM (STRING). É proibido usar arrays ou JSON dentro delas.

A chave "analysis" será lida diretamente pelo usuário final. Escreva como um Analista Esportivo Institucional Sênior. O texto deve ser 100% objetivo e técnico, focado em fatos, evitando adjetivos qualificadores desnecessários. É terminantemente PROIBIDO o uso de exageros, promessas, ou linguagem sensacionalista.
Formate a "analysis" EXATAMENTE nestes 3 parágrafos curtos usando emojis:
"📊 A Lógica dos Números: [Explique a consistência do Hit Rate real extraído da imagem de forma clara e objetiva]."
"⚽ Leitura de Jogo (Game Script): [Descreva a dinâmica tática esperada baseada nos dados ofensivos/defensivos]."
"🎯 Risco e Retorno: [Conclua explicando como a escolha das linhas protege o capital dentro da odd proposta]."

Retorne ESTRITAMENTE um JSON válido neste formato de exemplo:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Partida (FT) - Mais de 8.5 Escanteios",
      "prob": 78,
      "sampleSize": 10
    }
  ],
  "alternativeCombination": "Foco em Gols: Mais de 0.5 Gols HT e Mais de 1.5 Gols FT.",
  "conservativeCombination": "Extrema Segurança: Mais de 0.5 Gols FT e Total - Mais de 6.5 Cantos.",
  "analysis": "📊 A Lógica dos Números: Os dados exibem uma frequência de 75% na linha de Gols na amostra apresentada...\\n\\n⚽ Leitura de Jogo (Game Script): O cenário indica um confronto com controle territorial da equipe mandante...\\n\\n🎯 Risco e Retorno: A composição destas duas variáveis dilui a exposição direcional e se alinha com o alvo estipulado."
}`;

    const imageParts = images.map((img: any) => ({
      inlineData: { data: img.base64, mimeType: img.mimeType },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();

    const matchJson = responseText.match(/\{[\s\S]*\}/);
    if (!matchJson)
      throw new Error('A IA não conseguiu formatar os dados.');

    let json;
    try {
      json = JSON.parse(matchJson[0]);
    } catch {
      throw new Error('Falha na conversão do JSON retornado.');
    }

    // ==========================================
    // 🧠 DETECÇÃO DE CORRELAÇÃO E SCORE ESTRUTURAL
    // ==========================================
    let structuralRiskScore = 0;

    if (json.selections && json.selections.length > 1) {
      const marketsLower = json.selections.map((s: any) => (s.market || '').toLowerCase());
      const teamMentions: Record<string, number> = {};

      json.selections.forEach((sel: any) => {
        const matchStr = (sel.match || '').toLowerCase();
        const parts = matchStr.split(/\s*(vs|x|-)\s*/i);

        if (parts.length >= 3) {
          const home = parts[0].trim();
          const away = parts[2].trim();
          const marketStr = (sel.market || '').toLowerCase();

          if (home && marketStr.includes(home)) teamMentions[home] = (teamMentions[home] || 0) + 1;
          if (away && marketStr.includes(away)) teamMentions[away] = (teamMentions[away] || 0) + 1;
        }
      });

      Object.values(teamMentions).forEach(count => {
        if (count >= 2) structuralRiskScore += 2;
      });

      const hasHT = marketsLower.some((m: string) => m.includes('(ht)') || m.includes('1º tempo') || m.includes('1o tempo'));
      if (hasHT) structuralRiskScore += 1;

      const hasTotalMarket = marketsLower.some((m: string) => m.includes('total') || m.includes('partida') || m.includes('jogo'));
      const hasNonTotalMarket = marketsLower.some((m: string) => !m.includes('total') && !m.includes('partida') && !m.includes('jogo'));

      if (hasTotalMarket && hasNonTotalMarket) structuralRiskScore += 1;
    }

    // ==========================================
    // 🧮 CÁLCULO DE ODD JUSTA (VOLATILITY ENGINE)
    // ==========================================
    if (json.selections && json.selections.length > 0) {

      // 1. Aplica a Volatilidade por Mercado dentro do reduce
      const rawCombinedProb = json.selections.reduce(
        (acc: number, curr: any) => {
          const rawProb = (Number(curr.prob) || 75) / 100;
          const volatilityPenalty = getMarketVolatilityPenalty(curr.market || '');
          
          return acc * (rawProb * volatilityPenalty);
        }, 1
      );

      // 2. Extrai a média de amostragem
      const avgSample = json.selections.reduce((acc: number, curr: any) => acc + (Number(curr.sampleSize) || 10), 0) / json.selections.length;

      const confidenceAdjustment =
        avgSample >= 15 ? 1 :
        avgSample >= 10 ? 0.97 :
        avgSample >= 7 ? 0.94 :
        0.90;

      const SHRINK_FACTOR = 0.93;
      const CORRELATION_PENALTY = 0.97;

      const structuralPenalty =
        structuralRiskScore >= 4 ? 0.90 :
        structuralRiskScore === 3 ? 0.93 :
        structuralRiskScore === 2 ? 0.95 :
        structuralRiskScore === 1 ? 0.97 :
        1;

      // 3. Aplica Punições Globais
      const finalProb =
        rawCombinedProb *
        SHRINK_FACTOR *
        confidenceAdjustment *
        CORRELATION_PENALTY *
        structuralPenalty;

      json.combinedProb = Math.round(finalProb * 100);
      json.fairOdd = Number((1 / finalProb).toFixed(2));
      
      // 4. Classificação Visual de Risco do Bilhete
      let riskLabel = "BAIXO";
      if (structuralRiskScore >= 3 || avgSample < 10 || finalProb < 0.45) {
         riskLabel = "ALTO";
      } else if (structuralRiskScore >= 1 || avgSample < 15 || finalProb < 0.55) {
         riskLabel = "MÉDIO";
      }
      
      json.structuralRiskScore = structuralRiskScore;
      json.riskLevel = riskLabel;

    } else {
      throw new Error('Nenhuma seleção válida encontrada.');
    }

    return res.status(200).json(json);

  } catch (error: any) {
    console.error("Erro Vision Builder:", error);
    return res.status(400).json({
      error: error.message || 'Erro ao processar múltipla.'
    });
  }
}