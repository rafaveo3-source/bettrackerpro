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

// 🌍 MAPEAÇÃO DE PRIORS GLOBAIS FRACOS (WEAK PRIORS)
// Ao invés de hardcodar ligas, usamos uma média global com baixo peso (alpha + beta = 4)
// Isso ancora amostras pequenas sem esmagar as tendências fortes dos gráficos.
const getGlobalWeakPriors = (market: string) => {
  const mkt = market.toLowerCase();
  
  let alpha = 2.0; 
  let beta = 2.0;

  if (mkt.includes('gol') || mkt.includes('gols')) {
      if (mkt.includes('1.5') && !mkt.includes('ht') && !mkt.includes('1º')) {
          alpha = 2.9; beta = 1.1; // Baseline Global ~72%
      } else if (mkt.includes('0.5') && (mkt.includes('ht') || mkt.includes('1º'))) {
          alpha = 2.6; beta = 1.4; // Baseline Global ~65%
      } else if (mkt.includes('2.5')) {
          alpha = 2.0; beta = 2.0; // Baseline Global ~50%
      } else {
          alpha = 2.4; beta = 1.6; // ~60%
      }
  } else if (mkt.includes('ambos') || mkt.includes('btts') || mkt.includes('marcam')) {
      alpha = 2.2; beta = 1.8; // Baseline Global ~55%
  } else if (mkt.includes('escanteio') || mkt.includes('canto')) {
      alpha = 2.2; beta = 1.8; // Baseline Global ~55%
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
      : `- 🛑 REGRA DE ESTRUTURAÇÃO (CROSS-MARKET): Priorize cruzar mercados diferentes (Ex: Gols + Escanteios). Exceção: Permitido repetir o mercado APENAS se forem cronologias diferentes (Ex: HT + FT). NUNCA combine mercado de time com mercado da partida.`;

    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));

    // 🔥 LOOP DE AUTO-HEALING
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
3. DIVERGÊNCIA CASA/FORA: Retorne "true" se o Hit Rate for carregado por apenas um time.
4. HIERARQUIA: H2H e dados das equipes têm PRIORIDADE ABSOLUTA sobre dados da liga.

⚠️ REGRAS DE MERCADO E LIQUIDEZ:
- Use: [ ${selectedMarketsStr} ].
- 🛑 LINHAS DE LIQUIDEZ: Para Gols, prefira linhas de 0.5 a 3.5. Para Escanteios Totais, prefira de 6.5 a 11.5. PROIBIDO sugerir linhas de escanteios extremamente baixas para equipes (mínimo exigido 3.5 para times e 6.5 para partida).
${crossMarketInstruction}

⚠️ REGRAS DE UX E FORMATAÇÃO (MUITO IMPORTANTE):
As chaves "alternativeCombination", "conservativeCombination" e "analysis" devem conter APENAS TEXTO CORRIDO HUMANO. É ESTRITAMENTE PROIBIDO INSERIR CÓDIGO JSON DENTRO DESSAS STRINGS.
Para a chave "analysis", VOCÊ DEVE OBRIGATORIAMENTE usar duas quebras de linha escapeadas ("\\n\\n") para separar os 3 parágrafos.

Formato OBRIGATÓRIO da analysis:
"📊 A Lógica dos Números: [...]\\n\\n⚽ Leitura de Jogo (Game Script): [...]\\n\\n🎯 Risco e Retorno: [...]"

Retorne ESTRITAMENTE um JSON válido:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Partida (FT) - Mais de 8.5 Escanteios",
      "prob": 78,
      "sampleSize": 10,
      "sourceExcerpt": "Texto lido",
      "divergenceRisk": false
    }
  ],
  "alternativeCombination": "Apenas texto humano livre de código.",
  "conservativeCombination": "Apenas texto humano livre de código.",
  "analysis": "📊 A Lógica dos Números: O Hit rate é...\\n\\n⚽ Leitura de Jogo (Game Script): Esperamos que...\\n\\n🎯 Risco e Retorno: Isso protege..."
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

      if (hasLiquidityError) continue; 
      
      finalValidJson = json; 
    }

    // 🛡️ FALLBACK DETERMINÍSTICO
    if (!finalValidJson) {
      finalValidJson = {
        selections: [
          {
            match: "Análise Interrompida (Proteção de Capital)",
            market: "Mercados lidos não possuem liquidez aceitável",
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
        analysis: "📊 A Lógica dos Números: Os Hit Rates mais altos extraídos destas imagens pertencem a linhas muito curtas (ex: Cantos baixos para uma única equipe), que as casas de apostas precificam com odds muito ruins.\n\n⚽ Leitura de Jogo (Game Script): Para proteger seu capital, o motor backend abortou a sugestão da IA.\n\n🎯 Risco e Retorno: Sugerimos tirar prints de mercados mais amplos ou de jogos com maior liquidez."
      };
    }

    const json = finalValidJson;

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
    // 🧮 CALCULO QUANTITATIVO: FIM DO ERRO COMPOSTO
    // ==========================================
    if (json.selections && json.selections.length > 0) {
      
      const rawCombinedProb = json.selections.reduce(
        (acc: number, curr: any) => {
          let statedProb = (Number(curr.prob) || 75) / 100;
          let sampleSize = Number(curr.sampleSize) || 10;
          if (sampleSize < 1) sampleSize = 10;

          let hits = Math.round(statedProb * sampleSize);
          
          // Uso de Global Weak Priors
          const { alpha, beta } = getGlobalWeakPriors(curr.market || '');
          let rawProb = (hits + alpha) / (sampleSize + alpha + beta);
          
          const mkt = (curr.market || '').toLowerCase();
          const matchStr = (curr.match || '').toLowerCase();
          const parts = matchStr.split(/\s*(vs|x|-)\s*/i);
          const home = parts.length >= 3 ? parts[0].trim() : '';
          const away = parts.length >= 3 ? parts[2].trim() : '';
          const isTeamMarket = (home && mkt.includes(home)) || (away && mkt.includes(away)) || (!mkt.includes('partida') && !mkt.includes('jogo') && !mkt.includes('total') && !mkt.includes('ambos'));

          // Agrupando multiplicadores em um Array para aplicar a trava de "Penalty Bounding"
          let multipliers = [];

          const excerpt = curr.sourceExcerpt || '';
          if (!/\d/.test(excerpt)) multipliers.push(0.85);
          
          if (curr.divergenceRisk || (isTeamMarket && rawProb > 0.75)) multipliers.push(0.95);
          if (rawProb > 0.85) multipliers.push(0.97);

          const lineMatch = mkt.match(/(?:mais|menos|over|under)[^\d]*(\d+(\.\d+)?)/i);
          if (lineMatch) {
             const line = parseFloat(lineMatch[1]);
             if (mkt.includes('escanteio') || mkt.includes('canto')) {
                if (isTeamMarket && line < 4.5) multipliers.push(0.92); 
                if (!isTeamMarket && line < 8.5) multipliers.push(0.95); 
             } else if (mkt.includes('gol')) {
                if (line < 1.0 && !mkt.includes('ht') && !mkt.includes('1º')) multipliers.push(0.88); 
             }
          }

          multipliers.push(getMarketVolatilityPenalty(curr.market || ''));

          // O Segredo contra o Compounding Error: Nós multiplicamos as penalidades, mas IMPEDIMOS
          // que a punição total passe de 20% (0.80).
          let combinedLegPenalty = multipliers.reduce((a, b) => a * b, 1);
          combinedLegPenalty = Math.max(0.80, combinedLegPenalty);
          
          return acc * (rawProb * combinedLegPenalty);
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

      // REMOVIDO: finalProb = Math.min(finalProb, 0.60); A matemática agora é livre.

      json.combinedProb = Math.round(finalProb * 100);
      json.fairOdd = Number((1 / finalProb).toFixed(2));
      
      let riskLabel = "BAIXO";
      if (json.fairOdd === Infinity || finalProb === 0) {
         riskLabel = "ALTO";
      } else if (structuralRiskScore >= 3 || avgSample < 10 || finalProb < 0.40) {
         riskLabel = "ALTO";
      } else if (structuralRiskScore >= 1 || avgSample < 15 || implicitCorrelationFlag) {
         riskLabel = "MÉDIO"; // Sem travar em prob fixa, apenas pela estrutura
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