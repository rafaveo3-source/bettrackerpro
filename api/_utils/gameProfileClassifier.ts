export function classifyGameProfile(stats: any) {

  const goalPressure =
    (stats.home_goals_avg || 0) +
    (stats.away_goals_avg || 0);

  const cornerPressure =
    (stats.home_corners_avg || 0) +
    (stats.away_corners_avg || 0);

  const over15 = stats.over15_hit_rate || 0;

  let volatilityScore = 0;

  if (goalPressure >= 2.8) volatilityScore += 2;
  if (cornerPressure >= 9.5) volatilityScore += 2;
  if (over15 >= 70) volatilityScore += 1;

  if (volatilityScore >= 4) return "high";
  if (volatilityScore >= 2) return "medium";
  return "low";
}