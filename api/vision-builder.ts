import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

const getMarketVolatilityPenalty = (market: string) => {
  const m = market.toLowerCase();
  if (m.includes('1º tempo') || m.includes('1o tempo') || m.includes('(ht)') || m.includes('primeiro tempo')) {
      if (m.includes('escanteios') || m.includes('cantos') || m.includes('race')) return 0.92; 
      return 0.95; 
  }
  if (m.includes('ambos') || m.includes('btts') || m.includes('race')) return 0.96;
  if (m.includes('escanteios') || m.includes('cantos')) return 0.97;
  if (m.includes('gols') || m.includes('gol')) return 0.98;
  return 1;
};

// 🌍 MAPEAÇÃO DINÂMICA DE PRIORS POR LIGA
const getDynamicPriors = (market: string, leagueName: string) => {
  const mkt = market.toLowerCase();
  const l = (leagueName || '').toLowerCase();

  const isHighScoring = l.includes('bundesliga') || l.includes('eredivisie') || l.includes('premier league') || l.includes('mls') || l.includes('norway') || l.includes('switzerland');
  const isLowScoring = l.includes('serie b') || l.includes('championship') || l.includes('argentina') || l.includes('uruguay') || l.includes('segunda') || l.includes('africa');
  
  let alpha = 3.0; 
  let beta = 3.0;

  if (mkt.includes('gol') || mkt.includes('gols')) {
      if (mkt.includes('1.5') && !mkt.includes('ht') && !mkt.includes('1º')) {
          if (isHighScoring) { alpha = 4.8; beta = 1.2; } 
          else if (isLowScoring) { alpha = 3.9; beta = 2.1; } 
          else { alpha = 4.5; beta = 1.5; } 
      } else if (mkt.includes('0.5') && (mkt.includes('ht') || mkt.includes('1º'))) {
          if (isHighScoring) { alpha = 4.4; beta = 1.6; } 
          else if (isLowScoring) { alpha = 3.6; beta = 2.4; } 
          else { alpha = 4.1; beta = 1.9; } 
      } else if (mkt.includes('2.5')) {
          if (isHighScoring) { alpha = 3.6; beta = 2.4; } 
          else if (isLowScoring) { alpha = 2.4; beta = 3.6; } 
          else { alpha = 3.0; beta = 3.0; } 
      } else {
          alpha = 3.6; beta = 2.4; 
      }
  } else if (mkt.includes('ambos') || mkt.includes('btts') || mkt.includes('marcam')) {
      if (isHighScoring) { alpha = 3.6; beta = 2.4; } 
      else if (isLowScoring) { alpha = 2.7; beta = 3.3; } 
      else { alpha = 3.3; beta = 2.7; } 
  } else if (mkt.includes('escanteio') || mkt.includes('canto')) {
      alpha = 3.3; beta = 2.7; 
  }

  return { alpha, beta };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production') {
      if (origin && !origin.includes('bettrackerpro.com.br')) return res.status(403).json({ error: 'Acesso negado.' });
    } else {
      if (origin && !origin.includes('localhost') && !origin.includes('bettrackerpro.com.br')) return res.status(403).json({ error: 'Acesso negado no teste.' });
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

    const isSingleMarket = markets && markets.length === 1;
    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    const crossMarketInstruction = isSingleMarket
      ? `- 🛑 REGRA DE ESTRUTURAÇÃO (MERCADO ÚNICO): Usuário restringiu a [ ${selectedMarketsStr} ]. É PROIBIDO sugerir outro mercado. OBRIGATORIAMENTE cruze linhas cronológicas diferentes (Ex: HT + FT).`
      : `- 🛑 REGRA DE ESTRUTURAÇÃO (CROSS-MARKET): Priorize cruzar mercados diferentes (Ex: Gols + Escanteios). Exceção: Permitido repetir o mercado APENAS se forem cronologias diferentes (Ex: HT + FT). NUNCA combine mercado de time com mercado de partida.`;

    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    // 🔥 LOOP DE AUTO-HEALING (AGENTIC WORKFLOW)
    let finalValidJson = null;
    let attempts = 0;
    let lastInternalError = "";

    while (attempts < 2 && !finalValidJson) {
      attempts++;
      
      const prompt = `Você é um Analista Quantitativo HFT Institucional.
🎯 META DE ODD E PROBABILIDADE: A Odd Justa Final deve ficar IDEALMENTE entre @1.60 e @2.00. Construa OBRIGATORIAMENTE uma DUPLA. Priorize linhas com probabilidade entre 65% e 85%.
${lastInternalError ? `\n⚠️ ATENÇÃO - CORREÇÃO OBRIGATÓRIA DA TENTATIVA ANTERIOR: ${lastInternalError}\n` : ''}

⚙️ MOTOR MATEMÁTICO:
1. NÃO invente números. Use o Hit Rate real (%).
2. Se a amostra exata não estiver visível, DESCARTE O MERCADO.
3. Extraia o nome da liga/campeonato na chave "league".
4. DIVERGÊNCIA CASA/FORA: Retorne "true" se o Hit Rate for carregado por apenas um time.
5. HIERARQUIA: H2H e dados das equipes têm PRIORIDADE ABSOLUTA.

⚠️ REGRAS DE MERCADO E LIQUIDEZ:
- Use: [ ${selectedMarketsStr} ].
- 🛑 LINHAS DE LIQUIDEZ: Para Gols, prefira linhas de 0.5 a 3.5. Para Escanteios Totais, prefira de 6.5 a 11.5. PROIBIDO sugerir linhas de escanteios extremamente baixas para equipes (mínimo exigido 3.5 para times e 6.5 para partida).
${crossMarketInstruction}

⚠️ REGRAS DE UX (PROIBIDO JSON BLEED):
As chaves "alternativeCombination", "conservativeCombination" e "analysis" devem conter APENAS TEXTO CORRIDO HUMANO. É ESTRITAMENTE PROIBIDO INSERIR CÓDIGO JSON, CHAVES { } OU COLCHETES [ ] DENTRO DESSAS STRINGS.
Formato da analysis:
"📊 A Lógica dos Números: [...]"
"⚽ Leitura de Jogo (Game Script): [...]"
"🎯 Risco e Retorno: [...]"

Retorne ESTRITAMENTE um JSON válido:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "league": "Liga",
      "market": "Partida (FT) - Mais de 8.5 Escanteios",
      "prob": 78,
      "sampleSize": 10,
      "sourceExcerpt": "Texto lido",
      "divergenceRisk": false
    }
  ],
  "alternativeCombination": "Apenas texto humano livre de código.",
  "conservativeCombination": "Apenas texto humano livre de código.",
  "analysis": "..."
}`;

      const result = await model.generateContent([prompt, ...imageParts]);
      let responseText = result.response.text();
      
      const matchJson = responseText.match(/\{[\s\S]*\}/);
      if (!matchJson) {
         lastInternalError = "Você não retornou um JSON válido. Retorne ESTRITAMENTE o formato JSON solicitado.";
         continue;
      }

      let json;
      try { 
        json = JSON.parse(matchJson[0]); 
      } catch { 
        lastInternalError = "O JSON retornado está quebrado. Certifique-se de escapar as aspas corretamente.";
        continue; 
      }

      // UX Fallback contra JSON Bleed
      if (typeof json.alternativeCombination === 'string' && json.alternativeCombination.includes('{"selections"')) {
         json.alternativeCombination = "Recomendamos explorar mercados cronológicos (HT vs FT) ou linhas conservadoras de totais da partida.";
      }
      if (typeof json.conservativeCombination === 'string' && json.conservativeCombination.includes('{"selections"')) {
         json.conservativeCombination = "Aplicar Fractional Drop: reduza as linhas originais em 1 ou 2 pontos de corte (ex: de 1.5 Gols para 0.5 Gols).";
      }

      // 🛡️ HARD FILTER DE LIQUIDEZ COM MELHOR CLASSIFICAÇÃO
      let hasLiquidityError = false;
      if (json.selections && Array.isArray(json.selections)) {
        for (let sel of json.selections) {
          const mkt = (sel.market || '').toLowerCase();
          const matchStr = (sel.match || '').toLowerCase();
          const parts = matchStr.split(/\s*(vs|x|-)\s*/i);
          const home = parts.length >= 3 ? parts[0].trim() : '';
          const away = parts.length >= 3 ? parts[2].trim() : '';
          
          const isTeamMarket = (home && mkt.includes(home)) || (away && mkt.includes(away)) || (!mkt.includes('partida') && !mkt.includes('jogo') && !mkt.includes('total') && !mkt.includes('ambos'));

          if (mkt.includes('escanteio') || mkt.includes('canto')) {
            const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
            if (lineMatch) {
              const line = parseFloat(lineMatch[1]);
              if (isTeamMarket && line < 3.5) {
                 lastInternalError = `PROIBIDO usar a linha ${line} para escanteios de equipe no mercado '${sel.market}'. O mínimo de liquidez aceitável para um time é 3.5. Sugira uma linha maior ou mude para o mercado da partida inteira.`;
                 hasLiquidityError = true;
                 break;
              }
              if (!isTeamMarket && line < 6.5) {
                 lastInternalError = `PROIBIDO usar a linha ${line} para escanteios da partida no mercado '${sel.market}'. O mínimo de liquidez aceitável para um jogo é 6.5. Sugira uma linha maior.`;
                 hasLiquidityError = true;
                 break;
              }
            }
          }
        }
      }

      if (hasLiquidityError) continue; // Volta para o while e tenta gerar de novo
      
      finalValidJson = json; // Passou nos testes
    }

    if (!finalValidJson) {
      // 🛡️ FALLBACK DETERMINÍSTICO (O nível 3 de orquestração)
      // Se a IA for teimosa por 2 vezes seguidas e insistir em mercados sem liquidez,
      // nós NÃO quebramos o app. Devolvemos um JSON de fallback educando o usuário.
      finalValidJson = {
        selections: [
          {
            match: "Análise Interrompida (Proteção de Capital)",
            league: "Sistema de Risco",
            market: "Mercados lidos não possuem liquidez comercial aceitável",
            prob: 0,
            sampleSize: 0,
            sourceExcerpt: "Fallback de Segurança Ativado pelo Motor Quant",
            divergenceRisk: false
          }
        ],
        combinedProb: 0,
        fairOdd: 0,
        structuralRiskScore: 5,
        riskLevel: "ALTO",
        alternativeCombination: "A IA encontrou padrões fortes, mas as linhas comerciais exigidas (Ex: Over 0.5 HT, Over 7.5 Cantos FT) não atingiram a volumetria mínima no gráfico.",
        conservativeCombination: "Aguarde o jogo entrar no Ao Vivo para pegar linhas mais ajustadas e justas.",
        analysis: "📊 A Lógica dos Números: Os Hit Rates mais altos extraídos destas imagens pertencem a linhas muito curtas (ex: Cantos baixos para uma única equipe), que as casas de apostas precificam com odds muito ruins (muito 'juice').\n\n⚽ Leitura de Jogo (Game Script): Para proteger seu capital, o motor backend abortou a sugestão da IA.\n\n🎯 Risco e Retorno: Sugerimos tirar prints de mercados mais amplos ou de jogos com maior liquidez."
      };
    }

    // ==========================================
    // 🧠 DETECÇÃO DE CORRELAÇÃO DINÂMICA
    // ==========================================
    let structuralRiskScore = 0;
    let dynamicCorrelationPenalty = 0.98; 
    let implicitCorrelationFlag = false;

    if (json.selections && json.selections.length > 1) {
      const marketsLower = json.selections.map((s: any) => (s.market || '').toLowerCase());
      
      const hasHT = marketsLower.some((m: string) => m.includes('(ht)') || m.includes('1º tempo'));
      const hasFT = marketsLower.some((m: string) => m.includes('(ft)') || m.includes('partida') || m.includes('jogo') || m.includes('total'));
      const isMixedHalves = hasHT && hasFT;

      const bothOvers = marketsLower.every((m: string) => m.includes('mais') || m.includes('over') || m.includes('ambos') || m.includes('btts'));
      const hasBTTS = marketsLower.some((m: string) => m.includes('ambos') || m.includes('btts'));
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

      if (hasBTTS && hasOverGols) { dynamicCorrelationPenalty = 0.92; structuralRiskScore += 3; } 
      else if (shareSameTeam && bothOvers) { dynamicCorrelationPenalty = 0.94; structuralRiskScore += 2; } 
      else if (isMixedHalves) { dynamicCorrelationPenalty = 0.96; } 
      else if (!shareSameTeam) { dynamicCorrelationPenalty = 0.98; } 
      else { dynamicCorrelationPenalty = 0.97; }
    }

    // ==========================================
    // 🧮 CALCULO QUANTITATIVO COM MARKET THICKNESS
    // ==========================================
    if (json.selections && json.selections.length > 0) {
      
      const rawCombinedProb = json.selections.reduce(
        (acc: number, curr: any) => {
          let statedProb = (Number(curr.prob) || 75) / 100;
          let sampleSize = Number(curr.sampleSize) || 10;
          if (sampleSize < 1) sampleSize = 10;

          let hits = Math.round(statedProb * sampleSize);
          const { alpha, beta } = getDynamicPriors(curr.market || '', curr.league || '');
          let rawProb = (hits + alpha) / (sampleSize + alpha + beta);
          
          const excerpt = curr.sourceExcerpt || '';
          let excerptPenalty = /\d/.test(excerpt) ? 1 : 0.85; 
          
          const mkt = (curr.market || '').toLowerCase();
          const matchStr = (curr.match || '').toLowerCase();
          const parts = matchStr.split(/\s*(vs|x|-)\s*/i);
          const home = parts.length >= 3 ? parts[0].trim() : '';
          const away = parts.length >= 3 ? parts[2].trim() : '';
          const isTeamMarket = (home && mkt.includes(home)) || (away && mkt.includes(away)) || (!mkt.includes('partida') && !mkt.includes('jogo') && !mkt.includes('total') && !mkt.includes('ambos'));

          const divergencePenalty = (curr.divergenceRisk || (isTeamMarket && rawProb > 0.75)) ? 0.95 : 1;
          let probConstraintPenalty = rawProb > 0.85 ? 0.97 : 1; 

          // 📈 MARKET THICKNESS SCORE (Alinhamento de Odds)
          let marketThicknessPenalty = 1;
          const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
          if (lineMatch) {
             const line = parseFloat(lineMatch[1]);
             if (mkt.includes('escanteio') || mkt.includes('canto')) {
                if (isTeamMarket && line < 4.5) marketThicknessPenalty = 0.92; // Linha de time magra
                if (!isTeamMarket && line < 8.5) marketThicknessPenalty = 0.95; // Linha de jogo magra
             } else if (mkt.includes('gol')) {
                if (line < 1.0 && !mkt.includes('ht') && !mkt.includes('1º')) marketThicknessPenalty = 0.88; // Over 0.5 FT tem muito juice
             }
          }

          const volatilityPenalty = getMarketVolatilityPenalty(curr.market || '');
          
          return acc * (rawProb * volatilityPenalty * probConstraintPenalty * divergencePenalty * excerptPenalty * marketThicknessPenalty);
        }, 1
      );

      const rawPureMath = json.selections.reduce((acc: number, curr: any) => acc * ((Number(curr.prob) || 75) / 100), 1);
      if (rawPureMath > 0.75) implicitCorrelationFlag = true;

      const avgSample = json.selections.reduce((acc: number, curr: any) => acc + (Number(curr.sampleSize) || 10), 0) / json.selections.length;
      const confidenceAdjustment = avgSample >= 15 ? 1 : avgSample >= 10 ? 0.98 : avgSample >= 7 ? 0.95 : 0.92;

      const SHRINK_FACTOR = 0.96; 
      
      const structuralPenalty =
        structuralRiskScore >= 4 ? 0.90 :
        structuralRiskScore === 3 ? 0.93 :
        structuralRiskScore === 2 ? 0.95 :
        structuralRiskScore === 1 ? 0.97 : 1;

      let finalProb = rawCombinedProb * SHRINK_FACTOR * confidenceAdjustment * dynamicCorrelationPenalty * structuralPenalty;

      finalProb = Math.min(finalProb, 0.60);

      json.combinedProb = Math.round(finalProb * 100);
      json.fairOdd = Number((1 / finalProb).toFixed(2));
      
      let riskLabel = "BAIXO";
      if (structuralRiskScore >= 3 || avgSample < 10 || finalProb < 0.40) riskLabel = "ALTO";
      else if (structuralRiskScore >= 1 || avgSample < 15 || finalProb < 0.50 || implicitCorrelationFlag) riskLabel = "MÉDIO";
      
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