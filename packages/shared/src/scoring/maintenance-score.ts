import type { RepoFeatures } from '../index.js';
import { clamp, recencyScore, booleanScore } from './utils.js';

export function scoreMaintenance(
  features?: RepoFeatures
): { score: number; reasons: string[] } {
  if (!features) {
    return { score: 0, reasons: [] };
  }

  let score = 0;
  const reasons: string[] = [];

  // 1. Recency (up to 40)
  if (features.activity.daysSinceLastCommit !== null) {
    const rScore = (recencyScore(features.activity.daysSinceLastCommit) / 100) * 40;
    score += rScore;
    if (features.activity.daysSinceLastCommit <= 30) {
      reasons.push("Recently updated");
    }
  }

  // 2. Releases (up to 15)
  if (features.maintenance.releaseCount > 0) {
    const relScore = clamp(features.maintenance.releaseCount * 5, 0, 15);
    score += relScore;
    reasons.push("Has releases");
  }

  // 3. Contributors (up to 15)
  if (features.maintenance.contributorsCount > 1) {
    const contScore = clamp(features.maintenance.contributorsCount * 3, 0, 15);
    score += contScore;
    if (features.maintenance.contributorsCount >= 5) {
      reasons.push("Multiple contributors");
    }
  }

  // 4. License (up to 10)
  const licScore = booleanScore(features.maintenance.hasLicense, 10);
  score += licScore;
  if (licScore > 0) {
    reasons.push("Has explicit license");
  }

  // 5. Issue Pressure (up to 20 points for LOW issue pressure)
  const openIssues = features.community.openIssues;
  const stars = features.community.stars;
  
  if (openIssues > 0 && stars > 0) {
    const issueRatio = openIssues / stars;
    if (issueRatio > 0.5) {
      // High pressure, no points
      reasons.push("High open issue pressure");
    } else if (issueRatio < 0.1) {
      // low pressure
      score += 20;
    } else {
      score += 10;
    }
  } else if (openIssues === 0) {
      score += 20;
  }

  return {
    score: clamp(score, 0, 100),
    reasons
  };
}
