import type { RepoFeatures, RepoResult } from '../index.js';
import { clamp, booleanScore, recencyScore } from './utils.js';

export function scoreModernity(
  repo: RepoResult,
  features?: RepoFeatures
): { score: number; reasons: string[] } {
  if (!features) {
    return { score: 0, reasons: [] };
  }

  const { technical, activity } = features;
  let score = 0;
  const reasons: string[] = [];

  const isJsEcosystem = 
    repo.language?.toLowerCase() === 'javascript' || 
    repo.language?.toLowerCase() === 'typescript' ||
    technical.hasPackageJson;

  let ciPoints = 0;
  if (technical.hasCi) {
    ciPoints = 25;
    reasons.push("Uses CI");
  }

  let activityPoints = 0;
  if (activity.daysSinceLastCommit !== null) {
      const recent = recencyScore(activity.daysSinceLastCommit);
      activityPoints = (recent / 100) * 25;
      if (recent >= 75) {
        reasons.push("Recently active");
      }
  }

  if (isJsEcosystem) {
    // 1. TypeScript (25)
    score += booleanScore(technical.hasTypeScript, 25);
    if (technical.hasTypeScript) {
      reasons.push("Uses TypeScript");
    }

    // 2. ESM (15)
    score += booleanScore(technical.hasEsm, 15);
    
    // 3. CI (25)
    score += ciPoints;

    // 4. Package Manager (10)
    if (technical.detectedPackageManager) {
      score += 10;
      reasons.push("Uses modern package setup");
    } else if (!isJsEcosystem) {
      score += 10; // Not going to happen inside this branch but keeping it safe
    }

    // 5. Recent Activity (25)
    score += activityPoints;
    
  } else {
    // Non-JS Ecosystem
    if (technical.hasCi) {
      score += 40;
      reasons.push("Uses CI");
    }
    
    if (technical.detectedPackageManager) {
      score += 30;
      reasons.push("Uses modern package setup");
    }
    
    if (activity.daysSinceLastCommit !== null) {
      const recent = recencyScore(activity.daysSinceLastCommit);
      score += (recent / 100) * 30;
      if (recent >= 75) {
        reasons.push("Recently active");
      }
    }
    
    if (score > 75 && !technical.hasCi) {
      score = 75; // Cap at 75 if no CI
    }
  }

  return {
    score: clamp(score, 0, 100),
    reasons
  };
}
