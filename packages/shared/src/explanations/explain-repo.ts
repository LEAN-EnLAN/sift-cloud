import type { RepoResult, QueryUnderstanding } from '../index.js';
import type { ScoredRepoResult } from '../scoring/types.js';
import type { RepoExplanation } from './types.js';

export function explainRepo(
  repo: ScoredRepoResult<RepoResult>,
  understanding: QueryUnderstanding
): RepoExplanation {
  const { score, features } = repo;
  const domain = understanding.domain && understanding.domain !== 'general' 
    ? understanding.domain 
    : 'this query';
  
  const stars = repo.stars || repo.features?.community?.stars || 0;
  
  let short = `Strong match for ${domain}.`;
  if (score.total >= 80) {
    short = `Excellent match for ${domain} with high authority, recent maintenance, and complete documentation signals.`;
  } else if (score.total >= 60) {
    short = `Solid option for ${domain} with reasonable signals.`;
  } else {
    short = `Possible option for ${domain}, though signals are weaker.`;
  }

  // Adjust short summary dynamically based on truthfulness
  if (features?.activity?.daysSinceLastCommit && features.activity.daysSinceLastCommit > 1000) {
    short = `Relevant to ${domain}, but maintenance is weak because the latest detected activity is old.`;
  } else if (stars < 100 && score.parts.relevance > 0) {
    short = `Relevant niche result for ${domain}, but adoption and maintenance signals are limited.`;
  } else if (features?.risk?.isTutorial || features?.risk?.isTemplate) {
    short = `Relevant terms match the query, but risk signals suggest this may be more of an example/tutorial than a production library.`;
  }
  
  const bullets: string[] = [];
  if (score.parts.relevance >= 20) bullets.push('Highly relevant to query terms.');
  
  const daysSinceLastCommit = features?.activity?.daysSinceLastCommit;
  if (daysSinceLastCommit !== undefined && daysSinceLastCommit <= 180) {
    bullets.push('Well-maintained with recent activity.');
  } else if (daysSinceLastCommit !== undefined && daysSinceLastCommit > 1000) {
    bullets.push('Appears stale based on the latest detected activity.');
  } else if (daysSinceLastCommit !== undefined && daysSinceLastCommit > 365) {
    bullets.push('Maintenance signal is weaker because the latest detected activity is old.');
  }

  if (score.parts.documentation >= 70 || (score.parts.documentation >= 10 && !features)) {
    bullets.push('Good documentation available.');
  } else {
    bullets.push('Documentation signals are limited.');
  }

  if (stars >= 1000 || score.parts.community >= 70) {
    bullets.push('Strong community adoption.');
  } else if (stars >= 100) {
    bullets.push('Moderate public adoption.');
  } else {
    bullets.push('Limited public adoption based on stars.');
  }

  if (score.parts.authority >= 70) {
    bullets.push('Canonical ecosystem repository.');
  }

  let finalBullets = Array.from(new Set([...bullets, ...score.reasons])).slice(0, 4);
  if (finalBullets.length === 0) finalBullets.push('Matched based on basic metadata.');

  const caveats: string[] = [];
  if (score.warnings && score.warnings.length > 0) {
    caveats.push(...score.warnings);
  }
  if (score.parts.riskPenalty > 0) {
    caveats.push(`Risk penalty applies: -${score.parts.riskPenalty} points.`);
  }
  if (!features) {
    caveats.push('Features unavailable; score relies solely on search metadata.');
  }
  
  if (features?.maintenance?.license) {
    const license = features.maintenance.license.toUpperCase();
    if (license.includes('GPL') || license.includes('AGPL') || license.includes('LGPL')) {
        caveats.push('Copyleft license detected; review licensing constraints before production use.');
    }
  }

  return {
    short,
    bullets: finalBullets,
    caveats
  };
}
