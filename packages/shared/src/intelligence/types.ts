export type ClassifiedDomain =
  | "pdf"
  | "jwt-auth"
  | "auth"
  | "orm"
  | "boilerplate"
  | "scraping"
  | "testing"
  | "cache"
  | "logging"
  | "cli"
  | "serialization"
  | "general";

export interface DomainClassification {
  domain: ClassifiedDomain;
  confidence: number;
  matchedTerms: string[];
  scores: Record<string, number>;
}

export interface WeightedKeyword {
  keyword: string;
  weight: number;
  source: "domain" | "action" | "language" | "technical" | "general";
}

export interface ScoredVariant {
  query: string;
  score: number;
  reasons: string[];
}

export interface QueryUnderstanding {
  original: string;
  normalized: string;
  domain: ClassifiedDomain; // Keep for convenience
  classification: DomainClassification;
  keywords: string[]; // From phase 1
  filteredKeywords: string[]; // From phase 1
  weightedKeywords: WeightedKeyword[];
  selectedSeeds: string[];
  rejectedSeeds: string[];
  lexicalWarnings: string[];
  variants: ScoredVariant[]; // Changed to ScoredVariant array
}
