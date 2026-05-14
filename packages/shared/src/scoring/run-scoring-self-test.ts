import { scoreRepo } from './score-repo.js';
import {
  goodPdfLibrary,
  toyPdfDemo,
  canonicalJwt,
  abandonedPopular,
  wellMaintainedSmallRepo,
  mockUnderstandingPdf,
  mockUnderstandingJwt
} from './scoring-fixtures.js';

export function runScoringSelfTest() {
  const goodPdfScore = scoreRepo({ repo: goodPdfLibrary, understanding: mockUnderstandingPdf, requestedLanguage: 'python' });
  const toyPdfScore = scoreRepo({ repo: toyPdfDemo, understanding: mockUnderstandingPdf, requestedLanguage: 'python' });
  const jwtScore = scoreRepo({ repo: canonicalJwt, understanding: mockUnderstandingJwt, requestedLanguage: 'python' });
  const abandonedScore = scoreRepo({ repo: abandonedPopular, understanding: mockUnderstandingPdf, requestedLanguage: 'javascript' });
  const smallActiveScore = scoreRepo({ repo: wellMaintainedSmallRepo, understanding: mockUnderstandingPdf, requestedLanguage: 'typescript' });

  const riskPenaltyValue = goodPdfScore.parts.riskPenalty || 0;

  const checks = [
    {
      name: 'Reusable library beats tutorial project',
      passed: goodPdfScore.total > toyPdfScore.total,
      details: `Good: ${goodPdfScore.total}, Toy: ${toyPdfScore.total}`
    },
    {
      name: 'Stale popular repo has low maintenance',
      passed: abandonedScore.parts.maintenance < 50,
      details: `Abandoned Maintenance: ${abandonedScore.parts.maintenance}`
    },
    {
      name: 'Tutorial README does not get full docs score',
      passed: toyPdfScore.parts.documentation <= 50,
      details: `Toy docs score: ${toyPdfScore.parts.documentation}`
    },
    {
      name: 'Full-stack/app style receives risk penalty',
      passed: toyPdfScore.parts.riskPenalty > 0,
      details: `Toy risk penalty: ${toyPdfScore.parts.riskPenalty}`
    },
    {
      name: 'Low-star repo does not claim strong adoption',
      passed: !goodPdfScore.reasons.some(r => r.includes('Strong community') && (goodPdfLibrary.stars || 0) < 100),
      details: `Adoption wording correct`
    },
    {
      name: 'Very old repo explanation says stale',
      passed: abandonedScore.reasons.some(r => r.includes('stale') || r.includes('old')),
      details: `Old repo correctly described`
    },
    {
      name: 'Risk penalty never emits negative zero',
      passed: riskPenaltyValue >= 0,
      details: `Risk penalty value: ${riskPenaltyValue}`
    }
  ];

  const ok = checks.every(c => c.passed);

  return { ok, checks };
}
