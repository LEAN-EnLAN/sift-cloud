import type { RepoResult } from '../index.js';
import type { ScoredRepoResult } from '../scoring/types.js';
import type { RepoComparison, RepoExplanation } from '../explanations/types.js';

export type ExplainedRepoResult = ScoredRepoResult<RepoResult> & { explanation?: RepoExplanation };

function formatScore(value: number): string {
  const normalized = Object.is(value, -0) ? 0 : value;
  return Number.isInteger(normalized)
    ? String(normalized)
    : normalized.toFixed(1);
}

export function renderMarkdown(
  query: string,
  language: string | undefined,
  repos: ExplainedRepoResult[],
  comparison?: RepoComparison
): string {
  let md = `# Sift Results\n\n`;
  md += `**Query:** ${query}\n`;
  if (language) {
    md += `**Language:** ${language}\n`;
  }
  md += `\n## Top ${Math.min(repos.length, 5)} repositories\n\n`;

  const topRepos = repos.slice(0, 5);
  
  topRepos.forEach((repo, idx) => {
    md += `### ${idx + 1}. ${repo.fullName} — Score: ${repo.score.total}\n\n`;
    md += `- **URL:** ${repo.url}\n`;
    let lastActivity = 'Unknown';
    if (repo.features?.activity?.daysSinceLastCommit !== null && repo.features?.activity?.daysSinceLastCommit !== undefined) {
        lastActivity = `${repo.features.activity.daysSinceLastCommit} days ago`;
    } else if (repo.updatedAt) {
        lastActivity = new Date(repo.updatedAt).toISOString().split('T')[0];
    }
    md += `- **Last activity:** ${lastActivity}\n`;
    md += `- **Stars:** ${repo.stars || repo.features?.community?.stars || 0}\n`;
    if (repo.features?.maintenance?.license) {
      md += `- **License:** ${repo.features.maintenance.license}\n`;
    }
    if (repo.features?.maintenance?.contributorsCount != null) {
      md += `- **Contributors:** ${repo.features.maintenance.contributorsCount}\n`;
    }
    if (repo.description) {
      md += `- **Description:** ${repo.description}\n`;
    }
    md += `\n**Why this repo:**\n`;
    const explanation = repo.explanation;
    if (explanation) {
      md += `${explanation.short}\n\n`;
      explanation.bullets.forEach(b => {
        md += `- ${b}\n`;
      });
      if (explanation.caveats && explanation.caveats.length > 0) {
        md += `\n**Caveats:**\n`;
        explanation.caveats.forEach(c => {
           md += `- ${c}\n`;
        });
      }
    } else {
        repo.score.reasons.forEach(r => {
            md += `- ${r}\n`;
        });
    }

    md += `\n**Score breakdown:**\n`;
    md += `- Relevance: ${formatScore(repo.score.parts.relevance)}\n`;
    md += `- Maintenance: ${formatScore(repo.score.parts.maintenance)}\n`;
    md += `- Documentation: ${formatScore(repo.score.parts.documentation)}\n`;
    md += `- Community: ${formatScore(repo.score.parts.community)}\n`;
    md += `- Modernity: ${formatScore(repo.score.parts.modernity)}\n`;
    md += `- Authority: ${formatScore(repo.score.parts.authority)}\n`;
    md += `- Risk penalty: ${formatScore(repo.score.parts.riskPenalty)}\n\n`;
  });

  if (comparison) {
    md += `## Mini comparison\n\n`;
    md += `${comparison.summary}\n\n`;
    if (comparison.tradeoffs.length > 0) {
        comparison.tradeoffs.forEach(t => {
            md += `- ${t}\n`;
        });
    }
  }

  return md;
}
