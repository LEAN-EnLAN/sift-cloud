import { ClassifiedDomain, WeightedKeyword } from "./types.js";

const technicalNouns = new Set([
  "database", "server", "api", "framework", "library", "router", "middleware", 
  "component", "system", "engine", "plugin", "module"
]);

const genericVerbs = new Set([
  "edit", "create", "make", "build", "use", "using", "implement", "add", "setup",
  "read", "write", "parse", "process", "manipulate", "update", "delete", "remove"
]);

export function extractWeightedKeywords(
  words: string[], 
  classification: { domain: ClassifiedDomain; matchedTerms: string[] },
  language?: string
): WeightedKeyword[] {
  return words.map(word => {
    let weight = 0.5;
    let source: WeightedKeyword["source"] = "general";

    if (classification.matchedTerms.includes(word)) {
      weight = 1.0;
      source = "domain";
    } else if (language && word.toLowerCase() === language.toLowerCase()) {
      weight = 0.8;
      source = "language";
    } else if (technicalNouns.has(word)) {
      weight = 0.7;
      source = "technical";
    } else if (genericVerbs.has(word)) {
      weight = 0.3;
      source = "action";
    }

    return { keyword: word, weight, source };
  }).sort((a, b) => b.weight - a.weight);
}
