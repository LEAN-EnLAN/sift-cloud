import type { RepoResult } from '../index.js';
import type { QueryUnderstanding } from '../intelligence/types.js';

export const mockUnderstandingPdf: QueryUnderstanding = {
  original: 'edit pdf python',
  domain: 'pdf',
  classification: { domain: 'pdf', confidence: 0.9, matchedTerms: [], scores: {} },
  normalized: 'edit pdf python',
  keywords: ['pdf'],
  filteredKeywords: ['pdf'],
  weightedKeywords: [{ keyword: 'pdf', weight: 1.0, source: 'domain' }],
  selectedSeeds: ['pymupdf/pymupdf', 'py-pdf/pypdf'],
  rejectedSeeds: [],
  lexicalWarnings: [],
  variants: []
};

export const mockUnderstandingJwt: QueryUnderstanding = {
  original: 'jwt auth python',
  domain: 'jwt-auth',
  classification: { domain: 'jwt-auth', confidence: 0.9, matchedTerms: [], scores: {} },
  normalized: 'jwt auth python',
  keywords: ['jwt'],
  filteredKeywords: ['jwt'],
  weightedKeywords: [{ keyword: 'jwt', weight: 1.0, source: 'domain' }],
  selectedSeeds: ['jpadilla/pyjwt'],
  rejectedSeeds: [],
  lexicalWarnings: [],
  variants: []
};

function createBaseRepo(id: number, name: string, owner: string): RepoResult {
  return {
    id,
    name,
    fullName: `${owner}/${name}`,
    owner: {
      login: owner,
      avatarUrl: `https://github.com/${owner}.png`,
      url: `https://github.com/${owner}`
    },
    description: '',
    url: `https://github.com/${owner}/${name}`,
    stars: 10,
    language: 'Python',
    updatedAt: new Date().toISOString(),
    retrievalMetadata: { variantCount: 1, matchedVariants: [] }
  };
}

export const goodPdfLibrary: RepoResult = {
  ...createBaseRepo(1, 'pypdf', 'py-pdf'),
  description: 'A pure-python PDF library capable of splitting, merging, cropping...',
  stars: 8000,
  features: {
    activity: { daysSinceLastCommit: 2 },
    maintenance: { releaseCount: 50, hasLicense: true, contributorsCount: 100, latestReleaseAt: new Date().toISOString() },
    docs: { hasReadme: true, readmeLength: 8000, hasInstallationSection: true, hasUsageSection: true, hasExamples: true, hasBadges: true },
    community: { stars: 8000, forks: 800, openIssues: 10, watchers: 100 },
    technical: { hasPackageJson: false, hasTypeScript: false, hasEsm: false, hasCi: true, detectedPackageManager: 'pip' },
    risk: { isArchived: false, isFork: false, isTemplate: false, isLikelyToyProject: false, isLikelyAwesomeList: false }
  }
};

export const toyPdfDemo: RepoResult = {
  ...createBaseRepo(2, 'pdf-demo', 'joebloggs'),
  description: 'how to edit pdfs',
  stars: 5,
  features: {
    activity: { daysSinceLastCommit: 500 },
    maintenance: { releaseCount: 0, hasLicense: false, contributorsCount: 1, latestReleaseAt: null },
    docs: { hasReadme: true, readmeLength: 200, hasInstallationSection: false, hasUsageSection: false, hasExamples: false, hasBadges: false },
    community: { stars: 5, forks: 0, openIssues: 0, watchers: 1 },
    technical: { hasPackageJson: false, hasTypeScript: false, hasEsm: false, hasCi: false, detectedPackageManager: null },
    risk: { isArchived: false, isFork: false, isTemplate: false, isLikelyToyProject: true, isLikelyAwesomeList: false }
  }
};

export const canonicalJwt: RepoResult = {
  ...createBaseRepo(3, 'pyjwt', 'jpadilla'),
  description: 'JSON Web Token implementation in Python',
  features: {
    activity: { daysSinceLastCommit: 10 },
    maintenance: { releaseCount: 20, hasLicense: true, contributorsCount: 50, latestReleaseAt: new Date().toISOString() },
    docs: { hasReadme: true, readmeLength: 4000, hasInstallationSection: true, hasUsageSection: true, hasExamples: true, hasBadges: true },
    community: { stars: 5000, forks: 500, openIssues: 20, watchers: 50 },
    technical: { hasPackageJson: false, hasTypeScript: false, hasEsm: false, hasCi: true, detectedPackageManager: 'pip' },
    risk: { isArchived: false, isFork: false, isTemplate: false, isLikelyToyProject: false, isLikelyAwesomeList: false }
  }
};

export const abandonedPopular: RepoResult = {
  ...createBaseRepo(4, 'old-popular', 'someone'),
  features: {
    activity: { daysSinceLastCommit: 1500 },
    maintenance: { releaseCount: 1, hasLicense: true, contributorsCount: 20, latestReleaseAt: '2019-01-01T00:00:00Z' },
    docs: { hasReadme: true, readmeLength: 1000, hasInstallationSection: false, hasUsageSection: false, hasExamples: false, hasBadges: false },
    community: { stars: 20000, forks: 2000, openIssues: 500, watchers: 1000 },
    technical: { hasPackageJson: true, hasTypeScript: false, hasEsm: false, hasCi: false, detectedPackageManager: 'npm' },
    risk: { isArchived: true, isFork: false, isTemplate: false, isLikelyToyProject: false, isLikelyAwesomeList: false }
  }
};

export const wellMaintainedSmallRepo: RepoResult = {
  ...createBaseRepo(5, 'small-active-lib', 'devboy'),
  features: {
    activity: { daysSinceLastCommit: 5 },
    maintenance: { releaseCount: 10, hasLicense: true, contributorsCount: 3, latestReleaseAt: new Date().toISOString() },
    docs: { hasReadme: true, readmeLength: 2000, hasInstallationSection: true, hasUsageSection: true, hasExamples: true, hasBadges: false },
    community: { stars: 80, forks: 5, openIssues: 1, watchers: 2 },
    technical: { hasPackageJson: true, hasTypeScript: true, hasEsm: true, hasCi: true, detectedPackageManager: 'npm' },
    risk: { isArchived: false, isFork: false, isTemplate: false, isLikelyToyProject: false, isLikelyAwesomeList: false }
  }
};
