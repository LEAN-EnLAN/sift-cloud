import type { RepoResult } from '../index.js';
import type { ScoredRepoResult } from '../scoring/types.js';
import type { RepoComparison } from './types.js';

export function compareRepos(
  repos: ScoredRepoResult<RepoResult>[]
): RepoComparison {
  if (!repos || repos.length === 0) {
    return {
      summary: 'No repositories found to compare.',
      strongest: null,
      tradeoffs: []
    };
  }

  const topRepos = repos.slice(0, 5);
  const strongest = topRepos[0].fullName;
  
  let summary = `Comparing top ${topRepos.length} results. ${strongest} leads with the highest overall score.`;

  const tradeoffs: string[] = [];
  
  if (topRepos.length > 1) {
    const first = topRepos[0];
    const second = topRepos[1];

    if (second.score.parts.documentation > first.score.parts.documentation + 5) {
      tradeoffs.push(`${second.fullName} has stronger documentation than ${first.fullName}.`);
    }
    if (second.score.parts.community > first.score.parts.community + 5) {
      tradeoffs.push(`${second.fullName} has wider community adoption than ${first.fullName}.`);
    }
    if (second.score.parts.authority > first.score.parts.authority) {
      tradeoffs.push(`${second.fullName} is a more canonical choice, despite a lower overall score.`);
    }
    if (second.score.total > 0 && first.score.total - second.score.total < 5) {
      tradeoffs.push(`${first.fullName} and ${second.fullName} are very closely matched.`);
    }
  }

  if (tradeoffs.length === 0 && topRepos.length > 1) {
     tradeoffs.push(`${strongest} outperforms the alternatives across most indicators.`);
  }

  return {
    summary,
    strongest,
    tradeoffs
  };
}
