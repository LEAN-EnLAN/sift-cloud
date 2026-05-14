import { ClassifiedDomain } from "./types.js";

export const domainSeeds: Record<Exclude<ClassifiedDomain, "general">, string[]> = {
  pdf: [
    "pdf",
    "document processing",
    "document parsing",
    "document extraction",
    "pdf manipulation",
    "pdf generation",
    "text extraction",
    "ocr"
  ],
  "jwt-auth": [
    "jwt",
    "json web token",
    "token authentication",
    "token verification",
    "bearer token",
    "claims",
    "signing",
    "authentication"
  ],
  auth: [
    "authentication",
    "authorization",
    "login",
    "session",
    "oauth",
    "openid connect"
  ],
  orm: [
    "orm",
    "object relational mapping",
    "database mapping",
    "sql mapping",
    "query builder",
    "migrations",
    "database models"
  ],
  boilerplate: ["starter", "template", "boilerplate"],
  scraping: [
    "web scraping",
    "crawler",
    "html parsing",
    "browser automation"
  ],
  testing: [
    "testing",
    "test runner",
    "assertions",
    "mocking",
    "e2e testing"
  ],
  cache: [
    "cache",
    "caching",
    "key value store",
    "memory cache",
    "distributed cache"
  ],
  logging: ["log", "logger"],
  cli: ["cli", "command"],
  serialization: ["serialize", "schema"],
};

export function getDomainSeeds(domain: ClassifiedDomain): string[] {
  if (domain === "general") return [];
  return domainSeeds[domain] || [];
}
