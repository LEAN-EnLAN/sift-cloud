import { GoogleGenAI } from '@google/genai';
import { type RepoExplanation } from '@sift/shared';

export async function explainWithGemini(
  input: {
    query: string;
    language?: string;
    repos: Array<{
      fullName: string;
      description?: string;
      score: {
        total: number;
        parts: Record<string, number>;
      };
      facts: {
        stars: number;
        license?: string | null;
        daysSinceLastCommit?: number | null;
        contributorsCount?: number | null;
        riskPenalty: number;
        isTutorialLike: boolean;
        libraryLikenessScore?: number | null;
      };
      deterministicExplanation: RepoExplanation;
    }>;
  },
  apiKey: string,
  options: { timeoutMs: number }
): Promise<Record<string, RepoExplanation & { isGemini: boolean }> | null> {
  const signal = AbortSignal.timeout(options.timeoutMs);
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a technical search assistant. Rewrite the following GitHub repository explanations professionally, concisely, and truthfully.
    
Rules:
- Rewrite the explanation to sound natural but strictly stick to the facts provided.
- Do NOT invent facts.
- Do NOT claim recent maintenance if daysSinceLastCommit > 180 (or if not provided).
- Do NOT claim strong adoption if stars < 1000.
- If the license is AGPL, GPL-2.0, GPL-3.0, or LGPL (case-insensitive), you MUST mention a copyleft caveat in the caveats array: "Copyleft license detected; review licensing constraints before production use."
- Only use the provided facts.
- Output MUST be strictly valid JSON matching the specified schema. Output a map where keys are fullName.

Input Facts:
Query: "${input.query}" (Language: ${input.language || 'any'})

Repositories:
${input.repos.map(r => `
Repository: ${r.fullName}
Description: ${r.description || 'N/A'}
Score Total: ${r.score.total}
Score Breakdown: ${JSON.stringify(r.score.parts)}
Stars: ${r.facts.stars}
License: ${r.facts.license || 'N/A'}
Days Since Last Commit: ${r.facts.daysSinceLastCommit ?? 'Unknown'}
Contributors Count: ${r.facts.contributorsCount ?? 'Unknown'}
Deterministic Output to Rewrite:
${JSON.stringify(r.deterministicExplanation, null, 2)}
`).join('\n\n')}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              short: {
                type: 'string',
                description: 'A 1-sentence concise summary specific to the repo and query.'
              },
              bullets: {
                type: 'array',
                items: { type: 'string' },
                description: 'Up to 4 truthful bullet points highlighting key signals. DO NOT output empty arrays.'
              },
              caveats: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of warnings. Must include copyleft warnings if applicable.'
              }
            },
            required: ['short', 'bullets', 'caveats']
          }
        },
        temperature: 0.1,
      }
    });

    const textPayload = response.text;
    if (!textPayload) return null;
    
    const parsed = JSON.parse(textPayload);
    const result: Record<string, RepoExplanation & { isGemini: boolean }> = {};
    for (const repo of input.repos) {
      const expl = parsed[repo.fullName];
      if (expl && typeof expl.short === 'string' && Array.isArray(expl.bullets) && Array.isArray(expl.caveats)) {
        result[repo.fullName] = {
          short: expl.short,
          bullets: expl.bullets,
          caveats: expl.caveats,
          isGemini: true
        };
      }
    }

    return result;

  } catch (error) {
    console.error('Gemini explanation failed:', error);
    return null;
  }
}
