export function runMonteCarloV10(data: any, type: 'corner' | 'goal', targetAdd: number, textData: string = "", iterations = 20000) {
    let hits = 0;
  
    const minute = Math.max(1, Math.min(95, data.min || 1));
    const isHT = minute <= 45;
    const maxTime = isHT ? 48 : 96; // Simula os acréscimos reais
    const timeLeft = Math.max(1, maxTime - minute);
  
    const totalCorners = data.totalCorners || 0;
    const totalGoals = data.totalGoals || 0;
  
    let ap = data.apPress || 0;
    let sot = data.sot || 0;
  
    const scoreDiff = (() => {
      if (!data.score || !data.score.includes('-')) return 0;
      const [h, a] = data.score.split('-').map(Number);
      return Math.abs(h - a); // Valor absoluto para saber se há diferença no placar
    })();
  
    const target = (type === 'corner' ? totalCorners : totalGoals) + targetAdd;
  
    // 🔥 PESO POR FONTE (Avaliando a qualidade do dado sujo)
    const sourceWeight = textData.includes("SofaScore") || textData.includes("sofascore") ? 1.0 :
                         textData.includes("Flashscore") || textData.includes("flashscore") ? 0.95 :
                         textData.includes("CornerPro") || textData.includes("Tempo das Estatísticas") ? 0.98 :
                         0.85; // Fontes desconhecidas ou genéricas perdem 15% de confiança
  
    for (let i = 0; i < iterations; i++) {
      let sim = type === 'corner' ? totalCorners : totalGoals;
  
      let localAP = ap;
      let localSOT = sot;
  
      for (let t = 0; t < timeLeft; t++) {
        // 🔥 VARIAÇÃO DE MOMENTUM (Random Walk)
        const momentumShift = (Math.random() - 0.5) * 4;
        localAP = Math.max(0, localAP + momentumShift);
  
        // 🔥 PRESSÃO → PROB BASE (Diferenciando Canto de Gol)
        let prob = type === 'corner' 
            ? (localAP / 100) * 0.15 
            : (localAP / 100) * 0.025; // Gols são estatisticamente muito mais raros
  
        // 🔥 EFICIÊNCIA REAL
        const efficiency = (localSOT + 1) / (localAP + 10);
        // Para gols, a eficiência (chutes no alvo) pesa 3x mais do que para cantos
        prob *= (0.6 + (efficiency * (type === 'goal' ? 3 : 1)));
  
        // 🔥 EFEITO DO TEMPO (Late game chaos)
        if (minute + t > 75) prob *= 1.25;
        if (minute + t > 85) prob *= 1.40;
  
        // 🔥 EFEITO DO PLACAR E DESESPERO
        if (scoreDiff !== 0) {
          if (data.needsGoal) prob *= 1.3;
          else prob *= 0.85; // Time vencendo tende a segurar o jogo
        }
  
        // 🔥 DEAD GAME DETECTOR
        if (localAP < 20 && localSOT < 2) prob *= 0.5;
  
        // 🔥 CLAMP (Limites matemáticos de sanidade)
        prob = Math.max(0.001, Math.min(prob, type === 'corner' ? 0.35 : 0.12));
  
        // 🎲 EVENTO OCORREU NESTE MINUTO
        if (Math.random() < prob) {
          sim++;
  
          // 🔥 CLUSTERS: O evento gera mais pressão (Abafa contínuo)
          localAP += type === 'corner' ? 4 : 2;
          localSOT += Math.random() < (type === 'goal' ? 0.8 : 0.3) ? 1 : 0;
        }
      }
  
      if (sim >= target) hits++;
    }
  
    let probFinal = hits / iterations;
    
    // Aplica a punição de dados ruins
    probFinal *= sourceWeight;
  
    return {
      probReal: probFinal * 100,
      fairOdd: probFinal > 0 ? 1 / probFinal : 0
    };
  }