import type { RepoFeatures } from '../index.js';
import { clamp, booleanScore } from './utils.js';

export function scoreDocumentation(
  features?: RepoFeatures
): { score: number; reasons: string[] } {
  if (!features) {
    return { score: 0, reasons: [] };
  }

  const { docs } = features;
  let score = 0;
  const reasons: string[] = [];

  // 1. Has Readme (20)
  score += booleanScore(docs.hasReadme, 20);
  if (docs.hasReadme) {
    reasons.push("README available");
  }

  // 2. Readme Length (up to 25)
  if (docs.readmeLength > 0) {
    // 0 -> 0, 5000 -> 25
    const lengthScore = clamp((docs.readmeLength / 5000) * 25, 0, 25);
    score += lengthScore;
  }

  // 3. Installation (15)
  score += booleanScore(docs.hasInstallationSection, 15);
  if (docs.hasInstallationSection) {
    reasons.push("Includes installation instructions");
  }

  // 4. Usage (15)
  score += booleanScore(docs.hasUsageSection, 15);
  if (docs.hasUsageSection) {
    reasons.push("Includes usage guidance");
  }

  // 5. Examples (15)
  score += booleanScore(docs.hasExamples, 15);
  if (docs.hasExamples) {
    reasons.push("Has code examples");
  }

  // 6. Badges (10)
  score += booleanScore(docs.hasBadges, 10);

  return {
    score: clamp(score, 0, 100),
    reasons
  };
}
