import type { RepoResult, RepoFeatures } from '../index.js';
import { clamp } from './utils.js';

export function scoreRiskPenalty(
  repo: RepoResult,
  features?: RepoFeatures
): { score: number; warnings: string[] } {
  let penalty = 0;
  const warnings: string[] = [];

  if (features && features.risk) {
    const { risk } = features;

    if (risk.isArchived) {
      penalty += 25;
      warnings.push("Repository is archived");
    }

    if (risk.isFork) {
      penalty += 8;
      warnings.push("Repository is a fork");
    }

    if (risk.isTemplate) {
      penalty += 5;
      warnings.push("Repository is a template");
    }

    if (risk.isLikelyToyProject) {
      penalty += 18;
      warnings.push("Likely tutorial/demo/full-stack project");
    }

    if (risk.isLikelyAwesomeList) {
      penalty += 12;
      warnings.push("Likely awesome-list rather than usable library");
    }
  }

  if (repo.featureWarnings && repo.featureWarnings.length > 0) {
    const warningsCount = repo.featureWarnings.length;
    const wfScore = clamp(warningsCount * 2, 3, 8);
    penalty += wfScore;
    warnings.push("Feature extraction had missing data");
  } else if (!features) {
    penalty += 10;
    warnings.push("Missing entire feature payload (possibly due to limits)");
  }

  return {
    score: clamp(penalty, 0, 25),
    warnings
  };
}
