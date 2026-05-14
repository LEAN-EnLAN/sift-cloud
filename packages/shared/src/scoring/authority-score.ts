import type { RepoResult } from '../index.js';
import type { QueryUnderstanding } from '../intelligence/types.js';

export function scoreAuthority(
  repo: RepoResult,
  understanding: QueryUnderstanding
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  
  // Authority is now purely organic:
  // - stars/forks as proxy for recognition
  // - presence in selected seeds (neutral terms only)
  // No hardcoded canonical repo list allowed.

  const fullName = repo.fullName.toLowerCase();
  
  // Seed match (neutral domain terms only)
  for (const seed of understanding.selectedSeeds || []) {
    const seedClean = seed.split(' ')[0].toLowerCase();
    if (fullName.includes(seedClean) || repo.name.toLowerCase().includes(seedClean)) {
      reasons.push("Matches domain seed term");
      return { score: 40, reasons };
    }
  }

  // Fallback modest authority from popularity signals (deterministic)
  if ((repo.stars || 0) > 5000) {
    reasons.push("High community recognition");
    return { score: 25, reasons };
  }

  return { score: 0, reasons };
}
