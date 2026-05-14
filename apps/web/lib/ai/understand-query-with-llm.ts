import { GoogleGenAI } from '@google/genai';
import type { QueryUnderstanding, ClassifiedDomain, WeightedKeyword, ScoredVariant, DomainClassification } from '@sift/shared';
import { getGeminiApiKey } from './get-gemini-api-key';

export async function understandQueryWithLLM(
  query: string,
  language?: string
): Promise<QueryUnderstanding | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a technical search parser for GitHub queries.
Convert the user's intent into structured data for search.

1. Generate up to 5 strict GitHub search query variants. Append "fork:false archived:false" to each. If language is provided, append "language:${language}". Include domain-specific canonical repositories if known as separate variants (e.g., "repo:user/repo fork:false"). 
2. Extract important keywords and assign a weight (0.0 to 1.0).
3. Identify the domain out of this exact list: ["pdf", "jwt-auth", "auth", "orm", "boilerplate", "scraping", "testing", "cache", "logging", "cli", "serialization", "general"].
4. Identify any canonical repo 'seeds' like "owner/repo" that precisely match the domain/query.

User Query: "${query}"
Language: "${language || 'any'}"

Return ONLY valid JSON matching this structure:
{
  "variants": [{"query": "...", "score": 1, "reasons": ["..."]}],
  "keywords": ["..."],
  "weightedKeywords": [{"keyword": "...", "weight": 0.9, "source": "technical"}],
  "domain": "orm",
  "selectedSeeds": ["owner/repo"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.variants || !parsed.domain) return null;

    const classification: DomainClassification = {
      domain: parsed.domain as ClassifiedDomain || 'general',
      confidence: 0.9,
      matchedTerms: parsed.keywords || [],
      scores: { [parsed.domain]: 0.9 }
    };

    return {
      original: query,
      normalized: query.toLowerCase(),
      domain: parsed.domain as ClassifiedDomain || 'general',
      classification,
      keywords: parsed.keywords || [],
      filteredKeywords: parsed.keywords || [],
      weightedKeywords: parsed.weightedKeywords || [],
      selectedSeeds: parsed.selectedSeeds || [],
      rejectedSeeds: [],
      lexicalWarnings: [],
      variants: parsed.variants as ScoredVariant[]
    };
  } catch (error) {
    console.error('LLM query understanding failed:', error);
    return null;
  }
}
