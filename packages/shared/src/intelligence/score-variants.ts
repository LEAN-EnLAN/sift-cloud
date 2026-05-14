import { ScoredVariant } from "./types.js";

export function scoreVariants(
  variants: string[],
  baseKeywords: string[],
  seeds: string[]
): ScoredVariant[] {
  const scored: ScoredVariant[] = [];

  for (const variant of variants) {
    let score = 1.0;
    const reasons: string[] = [];
    const tokens = variant.split(" ");
    
    if (tokens.length > 8) {
      score -= 0.3;
      reasons.push("Penalty: Too many tokens (>8)");
    } else if (tokens.length >= 3 && tokens.length <= 6) {
      score += 0.2;
      reasons.push("Bonus: Ideal token length (3-6)");
    }

    let hasBase = false;
    for (const kw of baseKeywords) {
      if (variant.includes(kw)) {
        hasBase = true;
        break;
      }
    }
    if (hasBase) {
      score += 0.2;
      reasons.push("Bonus: Retains core keywords");
    } else {
      score -= 0.4;
      reasons.push("Penalty: Dropped all core keywords");
    }
    
    let seedCount = 0;
    for (const seed of seeds) {
      if (variant.includes(seed)) {
        seedCount++;
      }
    }
    if (seedCount > 2) {
      score -= 0.3;
      reasons.push("Penalty: Seed overload (>2)");
    }

    scored.push({
      query: variant,
      score: Number(score.toFixed(2)),
      reasons
    });
  }

  return scored.sort((a, b) => b.score - a.score);
}
