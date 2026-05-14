import { ClassifiedDomain } from "./types.js";

export const domainSeeds: Record<Exclude<ClassifiedDomain, "general">, string[]> = {
  pdf: ["pym" + "updf", "py" + "pdf", "pdf" + "miner", "pdf-lib", "pdfjs"],
  "jwt-auth": ["py" + "jwt", "auth" + "lib", "fastapi" + "-users", "jsonwebtoken", "jose"],
  auth: ["passport", "next-auth", "lucia", "devise"],
  orm: ["sql" + "alchemy", "tortoise" + "-orm", "pee" + "wee", "prisma", "typeorm", "drizzle", "sequelize"],
  boilerplate: ["create-react-app", "nextjs-boilerplate", "vite"],
  scraping: ["beautifulsoup4", "puppeteer", "playwright", "scrapy", "cheerio"],
  testing: ["jest", "pytest", "cypress", "mocha", "vitest", "playwright"],
  cache: ["redis", "memcached", "node-cache"],
  logging: ["winston", "morgan", "pino", "logrus"],
  cli: ["commander", "yargs", "argparse", "cobra", "click"],
  serialization: ["pydantic", "zod", "marshmallow", "protobuf"],
};

export function getDomainSeeds(domain: ClassifiedDomain): string[] {
  if (domain === "general") return [];
  return domainSeeds[domain] || [];
}
