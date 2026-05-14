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

  const checks = [
    {
      name: 'goodPdfLibrary outranks toyPdfDemo',
      passed: goodPdfScore.total > toyPdfScore.total,
      details: `Good PDF: ${goodPdfScore.total}, Toy PDF: ${toyPdfScore.total}`
    },
    {
      name: 'canonicalJwt gets high authority',
      passed: jwtScore.parts.authority >= 70,
      details: `JWT Authority: ${jwtScore.parts.authority}`
    },
    {
      name: 'abandonedPopular has low maintenance',
      passed: abandonedScore.parts.maintenance < 50,
      details: `Abandoned Maintenance: ${abandonedScore.parts.maintenance}`
    },
    {
      name: 'wellMaintainedSmall outranks abandonedPopular on maintenance',
      passed: smallActiveScore.parts.maintenance > abandonedScore.parts.maintenance,
      details: `Small Active Maint: ${smallActiveScore.parts.maintenance}, Abandoned Maint: ${abandonedScore.parts.maintenance}`
    }
  ];

  // Fix up the first check manually
  checks[0].passed = goodPdfScore.total > toyPdfScore.total;

  const ok = checks.every(c => c.passed);

  return { ok, checks };
}
