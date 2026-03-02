import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

// 🔥 MOTOR DE VOLATILIDADE DE MERCADO (VOLATILITY MULTIPLIER)
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

// 🌍 MAPEAÇÃO DINÂMICA DE PRIORS POR LIGA (LEAGUE-AWARE BAYESIAN ENGINE)
const getDynamicPriors = (market: string, leagueName: string) => {
  const mkt = market.toLowerCase();
  const l = (leagueName || '').toLowerCase();

  // Perfis de Ligas (Heurística de Baseline)
  const isHighScoring = l.includes('bundesliga') || l.includes('eredivisie') || l.includes('premier league') || l.includes('mls') || l.includes('norway') || l.includes('switzerland');
  const isLowScoring = l.includes('serie b') || l.includes('championship') || l.includes('argentina') || l.includes('uruguay') || l.includes('segunda') || l.includes('africa');
  
  let alpha = 3.0; // Default weight
  let beta = 3.0;

  if (mkt.includes('gol') || mkt.includes('gols')) {
      if (mkt.includes('1.5') && !mkt.includes('ht') && !mkt.includes('1º')) {
          // Over 1.5 FT
          if (isHighScoring) { alpha = 4.8; beta = 1.2; } // Baseline ~80%
          else if (isLowScoring) { alpha = 3.9; beta = 2.1; } // Baseline ~65%
          else { alpha = 4.5; beta = 1.5; } // Global Baseline ~75%
      } else if (mkt.includes('0.5') && (mkt.includes('ht') || mkt.includes('1º'))) {
          // Over 0.5 HT
          if (isHighScoring) { alpha = 4.4; beta = 1.6; } // ~73%
          else if (isLowScoring) { alpha = 3.6; beta = 2.4; } // ~60%
          else { alpha = 4.1; beta = 1.9; } // ~68%
      } else if (mkt.includes('2.5')) {
          if (isHighScoring) { alpha = 3.6; beta = 2.4; } // ~60%
          else if (isLowScoring) { alpha = 2.4; beta = 3.6; } // ~40%
          else { alpha = 3.0; beta = 3.0; } // ~50%
      } else {
          alpha = 3.6; beta = 2.4; // Generic Goals ~60%
      }
  } else if (mkt.includes('ambos') || mkt.includes('btts') || mkt.includes('marcam')) {
      if (isHighScoring) { alpha = 3.6; beta = 2.4; } // ~60%
      else if (isLowScoring) { alpha = 2.7; beta = 3.3; } // ~45%
      else { alpha = 3.3; beta = 2.7; } // ~55%
  } else if (mkt.includes('escanteio') || mkt.includes('canto')) {
      // Escanteios são menos dependentes da liga e mais do estilo de jogo das equipes, mantemos prior estável
      alpha = 3.3; beta = 2.7; // ~55% Baseline genérico
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
      : `- 🛑 REGRA DE ESTRUTURAÇÃO (CROSS-MARKET): Priorize cruzar mercados diferentes (Ex: Gols + Escanteios). Exceção: Permitido repetir o mercado APENAS se forem cronologias diferentes (Ex: HT + FT).`;

    const prompt = `Você é um Analista Quantitativo HFT Institucional e Gestor de Risco.
Sua missão é criar uma Aposta Combinada (Múltipla) lendo as imagens estatísticas fornecidas.

🎯 SUA META DE ODD E PROBABILIDADE:
A Odd Justa Final do seu bilhete deve ficar IDEALMENTE entre @1.60 e @2.00.
Construa OBRIGATORIAMENTE uma DUPLA (Apenas 2 seleções). Evite triplas.
Priorize linhas com probabilidade de acerto (Hit Rate) entre 65% e 85%. É PERMITIDO usar valores maiores se forem estatisticamente os mais representativos, mas nunca degrade o contexto.

⚙️ MOTOR MATEMÁTICO E REGRAS VISUAIS INVIOLÁVEIS:
1. LEITURA RESTRITA: É EXPRESSAMENTE PROIBIDO inventar números. Use apenas o Hit Rate real (%) visível.
2. ANTI-AMBIGUIDADE: Se o número exato de jogos da amostra (ex: 5, 10) não estiver explicitamente visível, DESCARTE O MERCADO.
3. VALIDAÇÃO CRUZADA: Na chave "sourceExcerpt", COPIE EXATAMENTE O TEXTO E NÚMEROS lidos que justificam a entrada.
4. DIVERGÊNCIA CASA/FORA: Na chave "divergenceRisk", retorne "true" se o Hit Rate pertencer quase inteiramente a apenas um dos times.
5. IDENTIFICAÇÃO DE LIGA: Extraia o nome do campeonato/liga presente na imagem e coloque na chave "league" (Ex: "England Championship").
6. HIERARQUIA DE DADOS: Estatísticas específicas de Confronto Direto (H2H) ou das equipes em campo têm PRIORIDADE ABSOLUTA sobre dados agregados.

⚠️ ESTRUTURAÇÃO DO BILHETE:
- Proibido Resultado Final (1x2), Cartões, Jogadores. Use: [ ${selectedMarketsStr} ].
${crossMarketInstruction}
- "alternativeCombination": Abordagem tática TOTALMENTE DIFERENTE da principal.
- "conservativeCombination": Aplique o "Fractional Drop" reduzindo as linhas.

⚠️ REGRAS DE FORMATAÇÃO E UX:
Tom 100% objetivo e técnico. Sem adjetivos emocionais.
"📊 A Lógica dos Números: [Fatos objetivos do Hit rate]"
"⚽ Leitura de Jogo (Game Script): [Dinâmica tática]"
"🎯 Risco e Retorno: [Proteção de capital]"

Retorne ESTRITAMENTE um JSON válido neste formato:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "league": "Nome da Liga (Ex: Premier League)",
      "market": "Partida (FT) - Mais de 8.5 Escanteios",
      "prob": 78,
      "sampleSize": 10,
      "sourceExcerpt": "Transcreva literalmente o texto lido",
      "divergenceRisk": false
    }
  ],
  "alternativeCombination": "...",
  "conservativeCombination": "...",
  "analysis": "..."
}`;

    const imageParts = images.map((img: any) => ({ inlineData: { data: img.base64, mimeType: img.mimeType } }));
    const result = await model.generateContent([prompt, ...imageParts]);
    const matchJson = result.response.text().match(/\{[\s\S]*\}/);
    if (!matchJson) throw new Error('Falha na extração de dados.');

    let json;
    try { json = JSON.parse(matchJson[0]); } catch { throw new Error('Falha no Parse.'); }

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
    // 🧮 CALCULO QUANTITATIVO: LEAGUE-AWARE BAYESIAN
    // ==========================================
    if (json.selections && json.selections.length > 0) {
      
      const rawCombinedProb = json.selections.reduce(
        (acc: number, curr: any) => {
          let statedProb = (Number(curr.prob) || 75) / 100;
          let sampleSize = Number(curr.sampleSize) || 10;
          if (sampleSize < 1) sampleSize = 10;

          // 1. Extração Discreta de Hits
          let hits = Math.round(statedProb * sampleSize);

          // 2. Obtenção Dinâmica dos Priors baseados na Liga extraída pela IA
          const { alpha, beta } = getDynamicPriors(curr.market || '', curr.league || '');

          // 3. Regressão Bayesiana Informada
          let rawProb = (hits + alpha) / (sampleSize + alpha + beta);
          
          // BLINDAGENS
          const excerpt = curr.sourceExcerpt || '';
          let excerptPenalty = /\d/.test(excerpt) ? 1 : 0.85; 
          
          const marketLow = (curr.market || '').toLowerCase();
          const isTeamMarket = !marketLow.includes('partida') && !marketLow.includes('jogo') && !marketLow.includes('total') && !marketLow.includes('ambos');
          const divergencePenalty = (curr.divergenceRisk || (isTeamMarket && rawProb > 0.75)) ? 0.95 : 1;

          let probConstraintPenalty = rawProb > 0.85 ? 0.97 : 1; 
          const volatilityPenalty = getMarketVolatilityPenalty(curr.market || '');
          
          return acc * (rawProb * volatilityPenalty * probConstraintPenalty * divergencePenalty * excerptPenalty);
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

      // BLINDAGEM MÁXIMA
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