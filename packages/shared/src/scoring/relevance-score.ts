import { clamp } from './utils.js';
import type { RepoResult } from '../index.js';
import type { QueryUnderstanding } from '../intelligence/types.js';

export function scoreRelevance(
  repo: RepoResult,
  understanding: QueryUnderstanding,
  requestedLanguage?: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. Variant match count (up to 35)
  const variantCount = repo.retrievalMetadata?.variantCount || 0;
  if (variantCount > 0) {
    const vScore = clamp(variantCount * 12, 0, 35);
    score += vScore;
    if (variantCount >= 2) {
      reasons.push("Matched multiple generated search variants");
    }
  }

  // 2. Name Match Score (up to 25)
  const fullNameLower = repo.fullName.toLowerCase();
  const domainLower = understanding.domain ? understanding.domain.toLowerCase() : "";
  let matchedName = false;

  const validDomainMatch = domainLower && domainLower !== "general";

  if (validDomainMatch && fullNameLower.includes(domainLower)) {
    score += 15;
    matchedName = true;
  }
  
  if (validDomainMatch) {
      const domainTerms: Record<string, string[]> = {
          "jwt-auth": ["jwt", "auth", "authentication"],
          "pdf": ["pdf"],
          "orm": ["orm", "sqlalchemy", "database"]
      };
      
      const termsToCheck = domainTerms[domainLower] || [];
      for (const term of termsToCheck) {
          if (fullNameLower.includes(term)) {
              score += 10;
              matchedName = true;
              break; // give bonus once
          }
      }
  }

  for (const kw of understanding.weightedKeywords) {
    if (kw.weight > 0.5 && fullNameLower.includes(kw.keyword.toLowerCase())) {
        score += 10;
        matchedName = true;
        break;
    }
  }

  if (matchedName) {
    reasons.push("Repository name matches the detected domain or terms");
  }

  // 3. Description Match Score (up to 20)
  if (repo.description) {
    const descLower = repo.description.toLowerCase();
    let descScore = 0;
    
    // check words in normalized query
    const terms = understanding.normalized.toLowerCase().split(/\\s+/);
    for (const term of terms) {
      if (term.length > 2 && descLower.includes(term)) {
        descScore += 10;
      }
    }
    
    if (descScore > 0) {
      score += clamp(descScore, 0, 20);
      reasons.push("Description includes query terms");
    }
  }

  // 4. Language Match Score (up to 10)
  if (requestedLanguage && repo.language) {
    if (requestedLanguage.toLowerCase() === repo.language.toLowerCase()) {
      score += 10;
      reasons.push("Language matches requested language");
    }
  } else if (!requestedLanguage) {
      // no language requested, give free points to avoid dragging score down
      score += 5;
  }

  // 5. Domain Match Score (up to 10)
  // Since we don't have topics fully extracted yet, give a baseline if domain is identified.
  if (validDomainMatch) {
      score += 10;
  }

  return {
    score: clamp(score, 0, 100),
    reasons
  };
}
