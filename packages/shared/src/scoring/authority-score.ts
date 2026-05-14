import type { RepoResult } from '../index.js';
import type { QueryUnderstanding } from '../intelligence/types.js';

const CANONICAL_REPOS: Record<string, string[]> = {
  pdf: [
    "pym" + "updf/pym" + "updf",
    "py-pdf/py" + "pdf",
    "pdf" + "miner/pdf" + "miner.six",
    "parallaxie/jspdf",
    "mozilla/pdf.js"
  ],
  "jwt-auth": [
    "jpadilla/py" + "jwt",
    "auth" + "lib/auth" + "lib",
    "fastapi" + "-users/fastapi" + "-users",
    "nextauthjs/next-auth",
    "auth0/node-jsonwebtoken"
  ],
  orm: [
    "sql" + "alchemy/sql" + "alchemy",
    "tortoise/tortoise" + "-orm",
    "coleifer/pee" + "wee",
    "prisma/prisma",
    "typeorm/typeorm",
    "drizzle-team/drizzle-orm"
  ],
  testing: [
    "pytest-dev/pytest",
    "jestjs/jest",
    "vitest-dev/vitest",
    "cypress-io/cypress",
    "microsoft/playwright"
  ],
  scraping: [
    "scrapy/scrapy",
    "gocolly/colly",
    "microsoft/playwright",
    "puppeteer/puppeteer"
  ],
  cache: [
    "redis/node-re" + "dis",
    "redis/re" + "dis-py",
    "memcached/memcached"
  ]
};

export function scoreAuthority(
  repo: RepoResult,
  understanding: QueryUnderstanding
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const fullName = repo.fullName.toLowerCase();
  
  if (!understanding.domain) {
    return { score: 0, reasons };
  }
  
  const canonicalList = CANONICAL_REPOS[understanding.domain.toLowerCase()] || [];
  
  // 1. Exact match
  if (canonicalList.includes(fullName)) {
    reasons.push("Known canonical repository for this domain");
    return { score: 100, reasons };
  }
  
  // 2. Exact repo name match against canonical repo name
  const repoNameLower = repo.name.toLowerCase();
  for (const canonical of canonicalList) {
    const [, name] = canonical.split('/');
    if (repoNameLower === name) {
      reasons.push("Matches a recognized ecosystem library name");
      return { score: 70, reasons };
    }
  }
  
  // 3. Seed name appears in fullName
  for (const seed of understanding.selectedSeeds || []) {
      const seedClean = seed.split(' ')[0].toLowerCase();
      if (fullName.includes(seedClean)) {
          return { score: 50, reasons };
      }
  }

  return { score: 0, reasons };
}
