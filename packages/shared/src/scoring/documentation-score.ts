import type { RepoFeatures } from '../index.js';
import { clamp, booleanScore } from './utils.js';

export function scoreDocumentation(
  features?: RepoFeatures,
  isLibraryIntent: boolean = false,
  isTutorialLike: boolean = false
): { score: number; reasons: string[] } {
  if (!features) {
    return { score: 0, reasons: [] };
  }

  const { docs } = features;
  let score = 0;
  const reasons: string[] = [];

  score += booleanScore(docs.hasReadme, 20);
  if (docs.hasReadme) reasons.push("README available");

  if (docs.readmeLength > 0) {
    const lengthScore = clamp((docs.readmeLength / 5000) * 25, 0, 25);
    score += lengthScore;
  }

  score += booleanScore(docs.hasInstallationSection, 15);
  if (docs.hasInstallationSection) reasons.push("Includes installation instructions");

  score += booleanScore(docs.hasUsageSection, 15);
  if (docs.hasUsageSection) reasons.push("Includes usage guidance");

  score += booleanScore(docs.hasExamples, 15);
  if (docs.hasExamples) reasons.push("Has code examples");

  score += booleanScore(docs.hasBadges, 10);

  if (isLibraryIntent && isTutorialLike) {
    score = Math.min(score, 50);
    reasons.push("README appears tutorial/example-oriented rather than reusable library documentation.");
  }

  return {
    score: clamp(score, 0, 100),
    reasons
  };
}
