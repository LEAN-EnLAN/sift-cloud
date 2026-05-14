import { z } from "zod";

export * from "./features/types.js";
export * from "./intelligence/types.js";
export { buildQueryVariants } from "./intelligence/build-query-variants.js";
export { classifyDomain } from "./intelligence/classify-domain.js";
export { normalizeQuery } from "./intelligence/normalize-query.js";
export { extractWeightedKeywords } from "./intelligence/extract-keywords.js";
export { filterLexicalTraps } from "./intelligence/lexical-traps.js";
export { selectSeeds } from "./intelligence/select-seeds.js";
export { scoreVariants } from "./intelligence/score-variants.js";
export * from "./features/date-utils.js";
export * from "./features/risk-detector.js";
export * from "./features/readme-analyzer.js";
export * from "./features/package-analyzer.js";

// Export scoring components
export * from "./scoring/types.js";
export * from "./scoring/utils.js";
export { scoreRepo } from "./scoring/score-repo.js";
export { SCORING_WEIGHTS, MAX_RISK_PENALTY } from "./scoring/weights.js";
export { runScoringSelfTest } from "./scoring/run-scoring-self-test.js";

// Export output and explanations components
export * from "./explanations/types.js";
export * from "./explanations/explain-repo.js";
export * from "./explanations/compare-repos.js";
export * from "./output/render-markdown.js";

export const SearchQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Query must be at least 2 characters")
    .max(100, "Query must be at most 100 characters")
    .transform((val) => val.replace(/\s+/g, " ")),
  language: z
    .string()
    .trim()
    .max(30, "Language must be at most 30 characters")
    .optional()
    .transform((val) => val || undefined),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const RepoResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  owner: z.object({
    login: z.string(),
    avatarUrl: z.string().nullable(),
    url: z.string().nullable()
  }).optional(),
  description: z.string().nullable(),
  stars: z.number(),
  url: z.string(),
  language: z.string().nullable(),
  updatedAt: z.string(),
  retrievalMetadata: z.object({
    matchedVariants: z.array(z.string()),
    variantCount: z.number()
  }).optional(),
  features: z.any().optional(), // Using z.any() for simplicity, types are enforced by RepoFeatures interface
  featureWarnings: z.array(z.string()).optional(),
});

export type RepoResult = z.infer<typeof RepoResultSchema>;
