import { ClassifiedDomain } from "./types.js";

export const domainSeeds: Record<Exclude<ClassifiedDomain, "general">, string[]> = {
  pdf: ["pymupdf", "pypdf", "pdfminer", "pdf-lib", "pdfjs"],
  "jwt-auth": ["pyjwt", "authlib", "fastapi-users", "jsonwebtoken", "jose"],
  auth: ["passport", "next-auth", "lucia", "devise"],
  orm: ["sqlalchemy", "tortoise-orm", "peewee", "prisma", "typeorm", "drizzle", "sequelize"],
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
