import { ClassifiedDomain, DomainClassification } from "./types.js";

const domainScores: Record<Exclude<ClassifiedDomain, "general">, string[]> = {
  pdf: ["pdf", "document", "ocr", "pdfs"],
  "jwt-auth": ["jwt", "token", "bearer", "jsonwebtoken"],
  auth: ["auth", "authentication", "login", "oauth", "autenticacion", "passport"],
  orm: ["orm", "database", "sqlalchemy", "prisma", "activerecord", "querybuilder", "sql"],
  boilerplate: ["boilerplate", "starter", "template", "scaffold", "kit"],
  scraping: ["scraping", "scraper", "crawler", "spider", "bs4", "puppeteer", "playwright"],
  testing: ["testing", "test", "jest", "pytest", "cypress", "mocha", "pruebas", "e2e"],
  cache: ["cache", "redis", "memcached", "caching"],
  logging: ["logging", "logger", "winston", "morgan", "logrus", "log"],
  cli: ["cli", "terminal", "command", "commander", "yargs", "argparse", "cobra"],
  serialization: ["serialization", "json", "xml", "yaml", "protobuf", "marshmallow", "pydantic", "zod"],
};

export function classifyDomain(words: string[]): DomainClassification {
  const scores: Record<string, number> = {};
  const matchedTerms: string[] = [];
  
  let bestDomain: ClassifiedDomain = "general";
  let maxScore = 0;
  let totalScore = 0;

  for (const [domain, triggers] of Object.entries(domainScores)) {
    let score = 0;
    for (const word of words) {
      if (triggers.includes(word)) {
        score++;
        matchedTerms.push(word);
      }
    }
    if (score > 0) {
      scores[domain] = score;
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        bestDomain = domain as ClassifiedDomain;
      }
    }
  }

  let confidence = 0;
  if (totalScore > 0) {
    confidence = maxScore / totalScore;
    const matchBoost = Math.min(1, 0.7 + (maxScore * 0.15));
    confidence = confidence * matchBoost;
  }

  return {
    domain: bestDomain,
    confidence: Number(confidence.toFixed(2)),
    matchedTerms: Array.from(new Set(matchedTerms)),
    scores
  };
}
