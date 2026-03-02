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
  if (m.includes('ambos') || m.includes('btts') || m.includes('race')) return 0.96;
  
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
    // 🛡️ ESCUDO 1: PROTEÇÃO DE ORIGEM (CORS VERCEL)
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
    
    if (!apiKey) return res.status(500).json({ error: 'Chave de API ausente.' });
    if (!email) return res.status(401).json({ error: 'Acesso não autorizado.' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.2 }, 
    });

    // 🔥 NOVA LÓGICA DINÂMICA DE FILTRO DE MERCADOS
    const isSingleMarket = markets && markets.length === 1;
    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    const crossMarketInstruction = isSingleMarket
      ? `- 🛑 REGRA DE ESTRUTURAÇÃO (MERCADO ÚNICO EXCLUSIVO): O usuário restringiu a análise para APENAS a categoria [ ${selectedMarketsStr} ]. É ESTRITAMENTE PROIBIDO sugerir qualquer outro mercado em todas as chaves da resposta. Para evitar bloqueios de redundância usando apenas essa categoria, você OBRIGATORIAMENTE deve cruzar linhas de naturezas cronológicas diferentes (Ex: HT + FT) ou mercados de Equipe + Partida.`
      : `- 🛑 REGRA DE ESTRUTURAÇÃO (CROSS-MARKET): Priorize cruzar mercados diferentes (Ex: 1 de Gols + 1 de Escanteios). Exceção: É permitido usar duas linhas do mesmo mercado APENAS se forem de naturezas cronológicas diferentes (Ex: Over 0.5 HT + Over 2.5 FT). NUNCA combine mercado de time com mercado de partida da mesma categoria.`;

    // 🔥 PROMPT HEDGE FUND 10/10: HIERARQUIA DE DADOS E ANTI-OPTIMIZATION DRIFT
    const prompt = `Você é um Analista Quantitativo HFT Institucional e Gestor de Risco.
Sua missão é criar uma Aposta Combinada (Múltipla) lendo as imagens estatísticas fornecidas.

🎯 SUA META DE ODD E PROBABILIDADE:
A Odd Justa Final do seu bilhete deve ficar IDEALMENTE entre @1.60 e @2.00 (limite @2.20).
Construa OBRIGATORIAMENTE uma DUPLA (Apenas 2 seleções). Evite triplas.
Priorize linhas com probabilidade de acerto (Hit Rate) entre 65% e 85%. No entanto, é TOTALMENTE PERMITIDO E ENCORAJADO usar valores fora desta faixa (ex: 90%+) se estes forem estatisticamente os mais representativos reais do confronto. Nunca degrade o contexto ou ignore dados primários apenas para forçar o encaixe na faixa padrão.

⚙️ MOTOR MATEMÁTICO E REGRAS VISUAIS INVIOLÁVEIS:
1. LEITURA RESTRITA (ANTI-ALUCINAÇÃO): É EXPRESSAMENTE PROIBIDO inventar números. Use apenas o Hit Rate real (%) visível.
2. 🛑 ANTI-AMBIGUIDADE VISUAL: Se o número exato de jogos da amostra (ex: 5, 10) NÃO estiver explicitamente visível, o mercado DEVE SER DESCARTADO.
3. 🛑 VALIDAÇÃO CRUZADA INTERNA: Na chave "sourceExcerpt", você deve COPIAR EXATAMENTE O TEXTO E OS NÚMEROS que você leu na imagem que justifica aquela entrada.
4. 🛑 DIVERGÊNCIA CASA/FORA: Na chave "divergenceRisk", retorne "true" se a porcentagem alta pertencer quase inteiramente a apenas um dos times.
5. 🛑 HIERARQUIA DE DADOS (PRIORIDADE ABSOLUTA): Se houver estatísticas específicas do confronto direto (H2H) ou das equipes em campo, elas têm PRIORIDADE ABSOLUTA. É ESTRITAMENTE PROIBIDO substituir ou ignorar dados específicos do confronto para utilizar dados agregados da liga/campeonato caso os dados das equipes estejam disponíveis.

⚠️ ESTRUTURAÇÃO DO BILHETE (RESPEITE OS FILTROS):
- Proibido Resultado Final (1x2), Cartões, Jogadores e Linhas Asiáticas. Use apenas: [ ${selectedMarketsStr} ].
${crossMarketInstruction}
- Na "alternativeCombination", proponha uma abordagem tática TOTALMENTE DIFERENTE da principal, mas obrigatoriamente RESTRITA aos mercados permitidos.
- Na "conservativeCombination", aplique o "Fractional Drop" reduzindo as linhas, também obrigatoriamente RESTRITO aos mercados permitidos.

⚠️ REGRAS DE FORMATAÇÃO E UX:
Nas chaves de texto, aja como um Analista Sênior. O texto deve ser 100% objetivo e técnico. Evite adjetivos qualificadores desnecessários e exageros.
"📊 A Lógica dos Números: [Fatos objetivos do Hit rate e amostra]"
"⚽ Leitura de Jogo (Game Script): [Dinâmica tática e divergência]"
"🎯 Risco e Retorno: [Proteção de capital]"

Retorne ESTRITAMENTE um JSON válido neste formato:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Partida (FT) - Mais de 8.5 Escanteios",
      "prob": 78,
      "sampleSize": 10,
      "sourceExcerpt": "Transcreva literalmente o texto e números lidos",
      "divergenceRisk": false
    }
  ],
  "alternativeCombination": "Foco na mesma categoria com linhas diferentes. (Ex: Mais de 0.5 HT e Mais de 1.5 FT).",
  "conservativeCombination": "Extrema Segurança aplicando Fractional Drop na categoria permitida.",
  "analysis": "📊 A Lógica dos Números: ...\\n\\n⚽ Leitura de Jogo (Game Script): ...\\n\\n🎯 Risco e Retorno: ..."
}`;

    const imageParts = images.map((img: any) => ({
      inlineData: { data: img.base64, mimeType: img.mimeType },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    const matchJson = responseText.match(/\{[\s\S]*\}/);
    if (!matchJson) throw new Error('A IA não conseguiu formatar os dados.');

    let json;
    try { json = JSON.parse(matchJson[0]); } catch { throw new Error('Falha na conversão do JSON retornado.'); }

    // ==========================================
    // 🧠 DETECÇÃO DE CORRELAÇÃO DINÂMICA (V 10.0)
    // ==========================================
    let structuralRiskScore = 0;
    let dynamicCorrelationPenalty = 0.98; 
    let implicitCorrelationFlag = false;

    if (json.selections && json.selections.length > 1) {
      const marketsLower = json.selections.map((s: any) => (s.market || '').toLowerCase());
      
      const hasHT = marketsLower.some((m: string) => m.includes('(ht)') || m.includes('1º tempo') || m.includes('1o tempo'));
      const hasFT = marketsLower.some((m: string) => m.includes('(ft)') || m.includes('partida') || m.includes('jogo') || m.includes('final') || m.includes('total'));
      const isMixedHalves = hasHT && hasFT;

      const bothOvers = marketsLower.every((m: string) => m.includes('mais') || m.includes('over') || m.includes('ambos') || m.includes('btts') || m.includes('marcam'));
      
      const hasBTTS = marketsLower.some((m: string) => m.includes('ambos') || m.includes('btts') || m.includes('marcam'));
      const hasOverGols = marketsLower.some((m: string) => (m.includes('mais') || m.includes('over')) && (m.includes('gol') || m.includes('gols')));
      
      const teamMentions: Record<string, number> = {};
      json.selections.forEach((sel: any) => {
        const parts = (sel.match || '').split(/\s*(vs|x|-)\s*/i);
        if (parts.length >= 3) {
          const home = parts[0].trim().toLowerCase();
          const away = parts[2].trim().toLowerCase();
          const marketStr = (sel.market || '').toLowerCase();
          if (home && marketStr.includes(home)) teamMentions[home] = (teamMentions[home] || 0) + 1;
          if (away && marketStr.includes(away)) teamMentions[away] = (teamMentions[away] || 0) + 1;
        }
      });

      const shareSameTeam = Object.values(teamMentions).some(count => count >= 2);

      // Algoritmo de Correlação Institucional Dinâmica
      if (hasBTTS && hasOverGols) {
          dynamicCorrelationPenalty = 0.92; // Correlação semântica pesada
          structuralRiskScore += 3;
      } else if (shareSameTeam && bothOvers) {
          dynamicCorrelationPenalty = 0.94; // Forte correlação direcional na mesma equipe
          structuralRiskScore += 2;
      } else if (isMixedHalves) {
          dynamicCorrelationPenalty = 0.96; // Diluição temporal
      } else if (!shareSameTeam) {
          dynamicCorrelationPenalty = 0.98; // Independência estrutural
      } else {
          dynamicCorrelationPenalty = 0.97; // Fallback
      }
    }

    // ==========================================
    // 🧮 CALCULO QUANTITATIVO (FILTROS DE REDUÇÃO)
    // ==========================================
    if (json.selections && json.selections.length > 0) {
      
      const rawCombinedProb = json.selections.reduce(
        (acc: number, curr: any) => {
          let rawProb = (Number(curr.prob) || 75) / 100;
          
          // BLINDAGEM 1: Validação Regex de sourceExcerpt
          const excerpt = curr.sourceExcerpt || '';
          const hasNumbers = /\d/.test(excerpt);
          let excerptPenalty = 1;
          if (!hasNumbers) excerptPenalty = 0.85; 
          
          // BLINDAGEM 2: Backend Autônomo de Divergência
          const marketLow = (curr.market || '').toLowerCase();
          const isTeamMarket = !marketLow.includes('partida') && !marketLow.includes('jogo') && !marketLow.includes('total') && !marketLow.includes('ambos');
          const isBackendDivergent = isTeamMarket && rawProb > 0.75;
          const divergencePenalty = (curr.divergenceRisk || isBackendDivergent) ? 0.95 : 1;

          // Filtro Quantitativo de Consistência Estatística
          // Nota: Mantemos o penalty para probs > 85%. Isso atua como um simulador da "margem da casa de aposta" (Juice/Vig)
          // Se a IA achar um mercado de 90%, o backend corta um pouco da gordura para evitar overconfidence cega.
          let probConstraintPenalty = 1;
          if (curr.prob > 85) probConstraintPenalty = 0.95; 
          else if (curr.prob < 65) probConstraintPenalty = 0.93; 

          const volatilityPenalty = getMarketVolatilityPenalty(curr.market || '');
          
          return acc * (rawProb * volatilityPenalty * probConstraintPenalty * divergencePenalty * excerptPenalty);
        }, 1
      );

      // Verificação Matemática de Coerência Externa (> 75%)
      const rawPureMath = json.selections.reduce((acc: number, curr: any) => acc * ((Number(curr.prob) || 75) / 100), 1);
      if (rawPureMath > 0.75) implicitCorrelationFlag = true;

      const avgSample = json.selections.reduce((acc: number, curr: any) => acc + (Number(curr.sampleSize) || 10), 0) / json.selections.length;

      const confidenceAdjustment =
        avgSample >= 15 ? 1 :
        avgSample >= 10 ? 0.97 :
        avgSample >= 7 ? 0.94 :
        0.90;

      const SHRINK_FACTOR = 0.93; 
      
      const structuralPenalty =
        structuralRiskScore >= 4 ? 0.90 :
        structuralRiskScore === 3 ? 0.93 :
        structuralRiskScore === 2 ? 0.95 :
        structuralRiskScore === 1 ? 0.97 :
        1;

      // Consolidação final
      let finalProb =
        rawCombinedProb *
        SHRINK_FACTOR *
        confidenceAdjustment *
        dynamicCorrelationPenalty *
        structuralPenalty;

      // BLINDAGEM 3: Hard Cap contra Overconfidence
      finalProb = Math.min(finalProb, 0.60);

      json.combinedProb = Math.round(finalProb * 100);
      json.fairOdd = Number((1 / finalProb).toFixed(2));
      
      // Ajuste Fino Visual
      let riskLabel = "BAIXO";
      if (structuralRiskScore >= 3 || avgSample < 10 || finalProb < 0.40) {
         riskLabel = "ALTO";
      } else if (structuralRiskScore >= 1 || avgSample < 15 || finalProb < 0.50 || implicitCorrelationFlag) {
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
    return res.status(400).json({ error: error.message || 'Erro ao processar múltipla.' });
  }
}