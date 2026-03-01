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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 🛡️ ESCUDO 1: PROTEÇÃO DE ORIGEM (CORS VERCEL)
    const origin = req.headers.origin || req.headers.referer || '';
    if (process.env.NODE_ENV === 'production') {
      if (origin && !origin.includes('bettrackerpro.com.br')) {
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

    const selectedMarketsStr = markets && markets.length > 0 ? markets.join(', ') : 'Gols, Escanteios';

    // 🔥 PROMPT HEDGE FUND 9.5: BLINDAGEM VISUAL, EXCERPT E DIVERGÊNCIA
    const prompt = `Você é um Analista Quantitativo HFT Institucional e Gestor de Risco.
Sua missão é criar uma Aposta Combinada (Múltipla) lendo as imagens estatísticas fornecidas.

🎯 SUA META DE ODD E PROBABILIDADE:
A Odd Justa Final do seu bilhete deve ficar IDEALMENTE entre @1.60 e @2.00 (limite @2.20).
Construa OBRIGATORIAMENTE uma DUPLA (Apenas 2 seleções). Evite triplas.
Priorize linhas com probabilidade de acerto entre 72% e 80%, mas é PERMITIDO flexibilizar entre 65% e 85% para um melhor enquadramento.

⚙️ MOTOR MATEMÁTICO E REGRAS VISUAIS INVIOLÁVEIS:
1. LEITURA RESTRITA (ANTI-ALUCINAÇÃO): É EXPRESSAMENTE PROIBIDO inventar números. Use apenas o Hit Rate real (%) visível.
2. 🛑 ANTI-AMBIGUIDADE VISUAL: Se o número exato de jogos da amostra (ex: 5, 10) NÃO estiver explicitamente visível, o mercado DEVE SER DESCARTADO.
3. 🛑 VALIDAÇÃO CRUZADA INTERNA: Na chave "sourceExcerpt", você deve COPIAR EXATAMENTE O TEXTO que você leu na imagem que justifica aquela entrada (Ex: "Mais de 1.5 - 80% (10 jogos)").
4. 🛑 DIVERGÊNCIA CASA/FORA: Na chave "divergenceRisk", retorne "true" se a porcentagem alta pertencer quase inteiramente a apenas um dos times (ex: Mandante tem 90% de Overs, Visitante tem 40%). Retorne "false" se ambos contribuírem para a estatística.

⚠️ ESTRUTURAÇÃO DO BILHETE:
- Proibido Resultado Final (1x2), Cartões, Jogadores e Linhas Asiáticas. Use apenas: [ ${selectedMarketsStr} ].
- 🛑 REGRA CROSS-MARKET: Priorize cruzar mercados diferentes (Gols + Escanteios). Só repita o mercado se forem linhas cronológicas distintas (ex: HT + FT). NUNCA combine "Mercado do Time" com "Mercado da Partida" da mesma categoria.
- Na "alternativeCombination", proponha uma abordagem tática TOTALMENTE DIFERENTE da principal.
- Na "conservativeCombination", aplique o "Fractional Drop" reduzindo a linha obrigatoriamente.

⚠️ REGRAS DE FORMATAÇÃO E UX:
Nas chaves de texto, aja como um Analista Sênior. Focado em fatos, sem exageros ou promessas. Use 3 parágrafos curtos:
"📊 A Lógica dos Números: [Fatos do Hit rate e amostra]"
"⚽ Leitura de Jogo (Game Script): [Dinâmica tática e divergência se houver]"
"🎯 Risco e Retorno: [Proteção de capital]"

Retorne ESTRITAMENTE um JSON válido neste formato:
{
  "selections": [
    {
      "match": "Time A vs Time B",
      "market": "Partida (FT) - Mais de 8.5 Escanteios",
      "prob": 78,
      "sampleSize": 10,
      "sourceExcerpt": "Transcreva literalmente a linha da imagem lida",
      "divergenceRisk": false
    }
  ],
  "alternativeCombination": "Foco em Gols: Mais de 0.5 Gols HT e Mais de 1.5 Gols FT.",
  "conservativeCombination": "Extrema Segurança: Mais de 0.5 Gols FT e Total - Mais de 6.5 Cantos.",
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
    // 🧠 DETECÇÃO DE CORRELAÇÃO DINÂMICA (V 9.5)
    // ==========================================
    let structuralRiskScore = 0;
    let dynamicCorrelationPenalty = 0.98; // Padrão Institucional Premium
    let implicitCorrelationFlag = false;

    if (json.selections && json.selections.length > 1) {
      const marketsLower = json.selections.map((s: any) => (s.market || '').toLowerCase());
      
      const hasHT = marketsLower.some((m: string) => m.includes('(ht)') || m.includes('1º tempo') || m.includes('1o tempo'));
      const hasFT = marketsLower.some((m: string) => m.includes('(ft)') || m.includes('partida') || !m.includes('tempo'));
      const isMixedHalves = hasHT && hasFT;

      const bothOvers = marketsLower.every((m: string) => m.includes('mais') || m.includes('over'));
      
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
      if (shareSameTeam && bothOvers) {
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
          
          // Filtro Quantitativo de Consistência Estatística (V 9.5)
          let probConstraintPenalty = 1;
          if (curr.prob > 85) probConstraintPenalty = 0.95; // Punição por possível forçação de linha segura
          else if (curr.prob < 65) probConstraintPenalty = 0.93; // Punição por alta variância isolada

          // Filtro de Divergência Casa/Fora (V 9.5)
          const divergencePenalty = curr.divergenceRisk ? 0.95 : 1;

          const volatilityPenalty = getMarketVolatilityPenalty(curr.market || '');
          
          return acc * (rawProb * volatilityPenalty * probConstraintPenalty * divergencePenalty);
        }, 1
      );

      // Verificação Matemática de Coerência Externa
      // Se a multiplicação pura das % (antes das punições) passar de 70%, é suspeito no mundo real.
      const rawPureMath = json.selections.reduce((acc: number, curr: any) => acc * ((Number(curr.prob) || 75) / 100), 1);
      if (rawPureMath > 0.70) implicitCorrelationFlag = true;

      const avgSample = json.selections.reduce((acc: number, curr: any) => acc + (Number(curr.sampleSize) || 10), 0) / json.selections.length;

      const confidenceAdjustment =
        avgSample >= 15 ? 1 :
        avgSample >= 10 ? 0.97 :
        avgSample >= 7 ? 0.94 :
        0.90;

      const SHRINK_FACTOR = 0.93; // Haircut estrutural de mercado
      
      const structuralPenalty =
        structuralRiskScore >= 4 ? 0.90 :
        structuralRiskScore === 3 ? 0.93 :
        structuralRiskScore === 2 ? 0.95 :
        structuralRiskScore === 1 ? 0.97 :
        1;

      // Consolidação final
      const finalProb =
        rawCombinedProb *
        SHRINK_FACTOR *
        confidenceAdjustment *
        dynamicCorrelationPenalty *
        structuralPenalty;

      json.combinedProb = Math.round(finalProb * 100);
      json.fairOdd = Number((1 / finalProb).toFixed(2));
      
      // Ajuste Fino Visual (Se sinalizado correlação implícita alta, nunca é risco Baixo)
      let riskLabel = "BAIXO";
      if (structuralRiskScore >= 3 || avgSample < 10 || finalProb < 0.45) {
         riskLabel = "ALTO";
      } else if (structuralRiskScore >= 1 || avgSample < 15 || finalProb < 0.55 || implicitCorrelationFlag) {
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