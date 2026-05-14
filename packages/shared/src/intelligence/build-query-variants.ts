import { QueryUnderstanding } from "./types.js";
import { normalizeQuery } from "./normalize-query.js";
import { classifyDomain } from "./classify-domain.js";
import { filterLexicalTraps } from "./lexical-traps.js";
import { extractWeightedKeywords } from "./extract-keywords.js";
import { selectSeeds } from "./select-seeds.js";
import { scoreVariants } from "./score-variants.js";

const domainExpansions: Record<string, string[]> = {
  pdf: ["processing", "manipulation"],
  "jwt-auth": ["authentication", "security"],
  orm: ["database", "mapping"],
  auth: ["security", "login"],
  scraping: ["crawler", "automation"],
};

interface VariantOptions {
  query: string;
  language?: string;
}

export function buildQueryVariants({ query, language }: VariantOptions): QueryUnderstanding {
  const normalized = normalizeQuery(query);
  const keywords = normalized.split(" ").filter(Boolean);
  
  // 1. Classification
  const classification = classifyDomain(keywords);
  const { domain, confidence } = classification;
  
  // 2. Lexical & Weights
  const { filtered: filteredKeywords, warnings: lexicalWarnings } = filterLexicalTraps(keywords, domain, confidence);
  const weightedKeywords = extractWeightedKeywords(filteredKeywords, classification, language);

  const coreKeywords = weightedKeywords
    .filter(kw => kw.weight >= 0.5)
    .map(kw => kw.keyword);
    
  if (coreKeywords.length === 0) {
    coreKeywords.push(...filteredKeywords);
  }

  // 3. Seeds
  const { selectedSeeds, rejectedSeeds, reasoning: seedReasoning } = selectSeeds(domain, confidence);

  const rawVariants = new Set<string>();
  const langSuffix = language ? `language:${language}` : "";
  const baseSuffix = `fork:false archived:false`;
  const suffix = [langSuffix, baseSuffix].filter(Boolean).join(" ");

  for (const seed of selectedSeeds) {
    rawVariants.add(`${seed} ${coreKeywords.join(" ")} ${suffix}`.trim().replace(/\s+/g, ' '));
  }

  if (domain !== "general" && domainExpansions[domain] && confidence > 0.4) {
    for (const exp of domainExpansions[domain]) {
      const importantKw = coreKeywords.filter(k => k !== domain).slice(0, 1).join(" ");
      rawVariants.add(`${domain} ${exp} ${importantKw} ${suffix}`.trim().replace(/\s+/g, ' '));
    }
  }

  // Focused canonical library variants for PDF
  if (domain === "pdf" && language?.toLowerCase() === "python") {
    rawVariants.add(`pymupdf pdf ${suffix}`.trim().replace(/\s+/g, ' '));
    rawVariants.add(`pypdf pdf ${suffix}`.trim().replace(/\s+/g, ' '));
    rawVariants.add(`pdfminer pdf ${suffix}`.trim().replace(/\s+/g, ' '));
    rawVariants.add(`pdf manipulation ${suffix}`.trim().replace(/\s+/g, ' '));
  }

  if (domain !== "general" && confidence > 0.6) {
    const topicDomain = domain === "jwt-auth" ? "jwt" : domain;
    rawVariants.add(`topic:${topicDomain} ${coreKeywords.slice(0,2).join(" ")} ${suffix}`.trim().replace(/\s+/g, ' '));
  }
  
  if (filteredKeywords.length > 0) {
    rawVariants.add(`${filteredKeywords.join(" ")} ${suffix}`.trim().replace(/\s+/g, ' '));
  }

  if (rawVariants.size === 0) {
    rawVariants.add(`${keywords.join(" ")} ${suffix}`.trim().replace(/\s+/g, ' '));
  }

  // 4. Scoring
  const variants = scoreVariants(Array.from(rawVariants), coreKeywords, selectedSeeds)
    .slice(0, 5); // top 5

  return {
    original: query,
    normalized,
    domain,
    classification,
    keywords,
    filteredKeywords,
    weightedKeywords,
    selectedSeeds,
    rejectedSeeds,
    lexicalWarnings: [...lexicalWarnings, ...seedReasoning],
    variants,
  };
}
