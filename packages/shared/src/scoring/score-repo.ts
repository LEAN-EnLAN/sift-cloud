import type { RepoResult } from '../index.js';
import type { QueryUnderstanding } from '../intelligence/types.js';
import type { RepoScore } from './types.js';

import { scoreRelevance } from './relevance-score.js';
import { scoreMaintenance } from './maintenance-score.js';
import { scoreDocumentation } from './documentation-score.js';
import { scoreCommunity } from './community-score.js';
import { scoreModernity } from './modernity-score.js';
import { scoreAuthority } from './authority-score.js';
import { scoreRiskPenalty } from './risk-penalty.js';
import { clamp, roundScore } from './utils.js';
import { SCORING_WEIGHTS } from './weights.js';

function isLibraryIntent(understanding: QueryUnderstanding): boolean {
  const domain = understanding.domain;
  return domain !== 'general' && domain !== undefined;
}

export function scoreRepo(params: {
  repo: RepoResult;
  understanding: QueryUnderstanding;
  requestedLanguage?: string;
}): RepoScore {
  const { repo, understanding, requestedLanguage } = params;
  
  const isLibIntent = isLibraryIntent(understanding);
  const isTutorial = !!(repo.features?.risk?.isTutorial || repo.features?.risk?.isLikelyToyProject);

  const relevance = scoreRelevance(repo, understanding, requestedLanguage);
  const maintenance = scoreMaintenance(repo.features);
  const documentation = scoreDocumentation(repo.features, isLibIntent, isTutorial);
  const community = scoreCommunity(repo.features);
  const modernity = scoreModernity(repo, repo.features);
  const authority = scoreAuthority(repo, understanding);
  const riskPenalty = scoreRiskPenalty(repo, repo.features);

  const total = 
    relevance.score * SCORING_WEIGHTS.relevance +
    maintenance.score * SCORING_WEIGHTS.maintenance +
    documentation.score * SCORING_WEIGHTS.documentation +
    community.score * SCORING_WEIGHTS.community +
    modernity.score * SCORING_WEIGHTS.modernity +
    authority.score * SCORING_WEIGHTS.authority - 
    riskPenalty.score;

  const combinedReasons = [
    ...relevance.reasons,
    ...maintenance.reasons,
    ...documentation.reasons,
    ...community.reasons,
    ...modernity.reasons,
    ...authority.reasons
  ];
  const reasons = Array.from(new Set(combinedReasons)).slice(0, 5);

  return {
    total: roundScore(clamp(total, 0, 100)),
    parts: {
      relevance: roundScore(relevance.score),
      maintenance: roundScore(maintenance.score),
      documentation: roundScore(documentation.score),
      community: roundScore(community.score),
      modernity: roundScore(modernity.score),
      authority: roundScore(authority.score),
      riskPenalty: roundScore(riskPenalty.score)
    },
    partReasons: {
      relevance: relevance.reasons,
      maintenance: maintenance.reasons,
      documentation: documentation.reasons,
      community: community.reasons,
      modernity: modernity.reasons,
      authority: authority.reasons,
      risk: riskPenalty.warnings
    },
    reasons,
    warnings: riskPenalty.warnings
  };
}
