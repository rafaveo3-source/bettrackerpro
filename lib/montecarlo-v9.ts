export function runMonteCarloV9(data: any, type: 'corner' | 'goal', targetAdd: number, iterations = 30000) {
    let hitsOverTarget = 0;
  
    const minute = Math.max(1, Math.min(95, parseFloat(data.min) || 1));
    const isHT = minute <= 45;
    const timeLeft = Math.max(1, ((isHT ? 45 : 90) + (isHT ? 3 : 6)) - minute);
  
    const totalCorners = parseFloat(data.totalCorners) || 0;
    const totalGoals = parseFloat(data.totalGoals) || 0;
    const apPress = parseFloat(data.apPress) || 0;
    const apDef = parseFloat(data.apDef) || 0;
    const sot = parseFloat(data.sot) || 0;
    const sofft = parseFloat(data.sofft) || 0;
  
    // 🔥 BASE RATES
    const pressureFactor = (apPress + apDef) / 100;
    const totalShots = sot + sofft;
    const efficiencyFactor = totalShots > 0 ? (sot / totalShots) : 0;
    const pressureDiff = apPress - apDef;
  
    const dominanceBoost = pressureDiff > 15 ? 1.15 : 1;
    const intensityBoost = data.matchTemperature === 'intense' ? 1.1 : 0.9;
  
    let lambda = 0;
    let targetLine = 0;
  
    if (type === 'corner') {
        const baseCornerRate = totalCorners / minute;
        // AJUSTE FINAL DO LAMBDA (CANTOS)
        lambda = baseCornerRate * (1 + pressureFactor * 0.6) * dominanceBoost * intensityBoost * (1 - efficiencyFactor * 0.3);
        
        // 🧠 DETECTOR DE DEAD GAME
        if (totalShots < 4 && data.matchTemperature === 'calm') lambda *= 0.6;
        // 🧠 DETECTOR DE AMASSO REAL
        if (pressureDiff > 20 && apPress > 45) lambda *= 1.25;
        
        // travas de sanidade
        lambda = Math.max(0.05, Math.min(lambda, 0.35));
        targetLine = totalCorners + targetAdd;
    } else {
        const baseGoalRate = totalGoals / minute;
        // AJUSTE FINAL DO LAMBDA (GOLS)
        lambda = baseGoalRate * (1 + pressureFactor * 0.4) * dominanceBoost * intensityBoost * (efficiencyFactor * 1.5);
        
        if (sot >= 4 && pressureDiff > 15) lambda *= 1.3;
        if (sot < 2) lambda *= 0.3; // Pune severamente se não houver letalidade
        
        lambda = Math.max(0.01, Math.min(lambda, 0.25));
        targetLine = totalGoals + targetAdd;
    }
  
    // 🎲 SIMULAÇÃO DE MONTE CARLO
    for (let i = 0; i < iterations; i++) {
      let simulatedEvents = type === 'corner' ? totalCorners : totalGoals;
  
      for (let t = 0; t < timeLeft; t++) {
        if (Math.random() < lambda) {
          simulatedEvents++;
        }
      }
      
      // Se simulou mais ou igual a linha alvo (Ex: Tinha 6, targetAdd é 0.5. TargetLine = 6.5. Simulou 7. 7 >= 6.5 -> Bateu)
      if (simulatedEvents >= targetLine) hitsOverTarget++;
    }
  
    const prob = hitsOverTarget / iterations;
  
    return {
      probReal: prob * 100, // Retorna em porcentagem
      fairOdd: prob > 0 ? 1 / prob : 0
    };
  }