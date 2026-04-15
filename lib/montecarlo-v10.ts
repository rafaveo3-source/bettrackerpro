export function runMonteCarloV10(data: any, type: 'corner' | 'goal', targetAdd: number, textData: string = "", iterations = 20000) {
    let hits = 0;
  
    const minute = Math.max(1, Math.min(95, data.min || 1));
    const isHT = minute <= 45;
    const maxTime = isHT ? 48 : 96; 
    const timeLeft = Math.max(1, maxTime - minute);
  
    const totalCorners = data.totalCorners || 0;
    const totalGoals = data.totalGoals || 0;
  
    const initialAP = data.apPress || 0;
    const initialSOT = data.sot || 0;
  
    const scoreDiff = (() => {
      if (!data.score || !data.score.includes('-')) return 0;
      const [h, a] = data.score.split('-').map(Number);
      return Math.abs(h - a); 
    })();
  
    const target = (type === 'corner' ? totalCorners : totalGoals) + targetAdd;
  
    // 🔥 PESO POR FONTE (Qualidade do dado)
    const sourceWeight = textData.includes("SofaScore") || textData.includes("sofascore") ? 1.0 :
                         textData.includes("Flashscore") || textData.includes("flashscore") ? 0.95 :
                         textData.includes("CornerPro") || textData.includes("Tempo das Estatísticas") ? 0.98 :
                         0.85; 
  
    for (let i = 0; i < iterations; i++) {
      let sim = type === 'corner' ? totalCorners : totalGoals;
  
      let localAP = initialAP;
      let localSOT = initialSOT;
  
      for (let t = 0; t < timeLeft; t++) {
        const currentMinute = minute + t;

        // 🔥 REVERSÃO À MÉDIA (Ornstein-Uhlenbeck)
        // Evita que a simulação derive para o infinito. A pressão sempre tenta voltar à gravidade do jogo.
        const meanReversion = (initialAP - localAP) * 0.05; 
        const momentumShift = (Math.random() - 0.5) * 4 + meanReversion;
        localAP = Math.max(0, localAP + momentumShift);
  
        // Probabilidade Base
        let prob = type === 'corner' 
            ? (localAP / 100) * 0.15 
            : (localAP / 100) * 0.025; 
  
        // Eficiência Real Dinâmica (Protegida contra divisão por zero)
        const efficiency = (localSOT + 1) / (Math.max(1, localAP) + 10);
        prob *= (0.6 + (efficiency * (type === 'goal' ? 3.5 : 1)));
  
        // 🔥 CURVA EXPONENCIAL DE FIM DE JOGO (Smooth Late Game Chaos)
        if (currentMinute > 75) {
            const timeFactor = Math.exp((currentMinute - 75) / 20); // Cresce gradativamente até o minuto 96
            prob *= Math.min(1.6, timeFactor); // Teto de 60% de boost no abafa final
        }
  
        // Efeito do Placar
        if (scoreDiff !== 0) {
          if (data.needsGoal) prob *= 1.35; // Aumentei o peso do desespero de quem está perdendo
          else prob *= 0.85; 
        }
  
        // Dead Game Detector
        if (localAP < 20 && localSOT < 2) prob *= 0.5;
  
        // Clamp de Sanidade
        prob = Math.max(0.001, Math.min(prob, type === 'corner' ? 0.35 : 0.12));
  
        if (Math.random() < prob) {
          sim++;
          localAP += type === 'corner' ? 4 : 2;
          localSOT += Math.random() < (type === 'goal' ? 0.8 : 0.3) ? 1 : 0;
        }
      }
  
      if (sim >= target) hits++;
    }
  
    let probFinal = hits / iterations;
    probFinal *= sourceWeight;
  
    return {
      probReal: probFinal * 100,
      fairOdd: probFinal > 0 ? 1 / probFinal : 0
    };
}