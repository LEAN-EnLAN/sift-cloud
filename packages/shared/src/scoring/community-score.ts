import type { RepoFeatures } from '../index.js';
import { clamp, logScale } from './utils.js';

export function scoreCommunity(
  features?: RepoFeatures
): { score: number; reasons: string[] } {
  if (!features) {
    return { score: 0, reasons: [] };
  }

  const { community } = features;
  let score = 0;
  const reasons: string[] = [];

  // Log scale reference values
  const maxStarsReference = 50000;
  const maxForksReference = 10000;
  const maxWatchersReference = 1000;

  // Stars (up to 60)
  const starsScore = (logScale(community.stars, maxStarsReference) / 100) * 60;
  score += starsScore;

  if (community.stars > 1000) {
    reasons.push("Strong community adoption");
  } else if (community.stars < 10) {
    reasons.push("Low public adoption");
  }

  // Forks (up to 25)
  const forksScore = (logScale(community.forks, maxForksReference) / 100) * 25;
  score += forksScore;

  if (community.forks > 50) {
    reasons.push("Healthy fork count");
  }

  // Watchers (up to 15)
  const watchersScore = (logScale(community.watchers, maxWatchersReference) / 100) * 15;
  score += watchersScore;

  return {
    score: clamp(score, 0, 100),
    reasons
  };
}
