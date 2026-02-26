type Selection = {
  market: string;
  prob: number;
  odd: number;
};

function estimateOdd(prob: number) {
  return Number((1 / (prob / 100)).toFixed(2));
}

export function buildDynamicMultiple(stats: any, allowedMarkets: string[]) {

  const selections: Selection[] = [];

  const totalGoalsAvg =
    (stats.home_goals_avg || 0) +
    (stats.away_goals_avg || 0);

  const totalCornersAvg =
    (stats.home_corners_avg || 0) +
    (stats.away_corners_avg || 0);

  if (allowedMarkets.includes("Gols")) {

    if (stats.over15_hit_rate >= 70) {
      selections.push({
        market: "Over 1.5 Gols FT",
        prob: stats.over15_hit_rate,
        odd: estimateOdd(stats.over15_hit_rate)
      });
    }

    if (totalGoalsAvg >= 2.8) {
      const prob = 65;
      selections.push({
        market: "Over 2.5 Gols FT",
        prob,
        odd: estimateOdd(prob)
      });
    }
  }

  if (allowedMarkets.includes("Escanteios")) {

    if (totalCornersAvg >= 9.5) {
      const prob = 66;
      selections.push({
        market: "Over 8.5 Cantos FT",
        prob,
        odd: estimateOdd(prob)
      });
    }

    if (totalCornersAvg >= 10.5) {
      const prob = 58;
      selections.push({
        market: "Over 9.5 Cantos FT",
        prob,
        odd: estimateOdd(prob)
      });
    }
  }

  const combinations: any[] = [];

  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {

      const combinedProb =
        (selections[i].prob / 100) *
        (selections[j].prob / 100);

      const combinedOdd =
        selections[i].odd *
        selections[j].odd;

      if (combinedOdd >= 1.6 && combinedOdd <= 2.0) {
        combinations.push({
          type: "dupla",
          picks: [selections[i], selections[j]],
          combinedProb: Math.round(combinedProb * 100),
          combinedOdd: Number(combinedOdd.toFixed(2))
        });
      }
    }
  }

  combinations.sort((a, b) => b.combinedProb - a.combinedProb);

  return combinations[0] || null;
}