import { GoogleGenAI } from '@google/genai';
import { type RepoExplanation } from '@sift/shared';

export async function explainWithGemini(input: {
  fullName: string;
  query: string;
  language?: string;
  scoreTotal: number;
  scoreParts: Record<string, number>;
  description?: string;
  stars: number;
  license?: string;
  daysSinceLastCommit?: number;
  contributors: number;
  deterministicExplanation: RepoExplanation;
}): Promise<RepoExplanation | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a technical search assistant. Rewrite the following GitHub repository explanation professionally, concisely, and truthfully.
    
Rules:
- Rewrite the explanation to sound natural but strictly stick to the facts provided.
- Do NOT invent facts.
- Do NOT claim recent maintenance if daysSinceLastCommit > 180 (or if not provided).
- Do NOT claim strong adoption if stars < 1000.
- If the license is AGPL, GPL-2.0, GPL-3.0, or LGPL (case-insensitive), you MUST mention a copyleft caveat in the caveats array: "Copyleft license detected; review licensing constraints before production use."
- Only use the provided facts.
- Output MUST be strictly valid JSON matching the specified schema.

Input Facts:
Repository: ${input.fullName}
Query: "${input.query}" (Language: ${input.language || 'any'})
Description: ${input.description || 'N/A'}
Score Total: ${input.scoreTotal}
Score Breakdown: ${JSON.stringify(input.scoreParts)}
Stars: ${input.stars}
License: ${input.license || 'N/A'}
Days Since Last Commit: ${input.daysSinceLastCommit ?? 'Unknown'}
Contributors Count: ${input.contributors}

Deterministic Output to Rewrite:
${JSON.stringify(input.deterministicExplanation, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            short: {
              type: 'string',
              description: 'A 1-sentence concise summary specific to the repo and query.'
            },
            bullets: {
              type: 'array',
              items: { type: 'string' },
              description: 'Up to 4 truthful bullet points highlighting key signals (maintenance, community, documentation, relevance). DO NOT output empty arrays.'
            },
            caveats: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of warnings. Must include copyleft warnings if applicable. May include risk penalties if > 0.'
            }
          },
          required: ['short', 'bullets', 'caveats']
        },
        temperature: 0.1,
      }
    });

    const textPayload = response.text;
    if (!textPayload) return null;
    
    const parsed = JSON.parse(textPayload);
    
    if (
      typeof parsed?.short === 'string' &&
      Array.isArray(parsed?.bullets) &&
      Array.isArray(parsed?.caveats)
    ) {
      return {
        short: parsed.short,
        bullets: parsed.bullets,
        caveats: parsed.caveats,
        isGemini: true
      } as RepoExplanation & { isGemini: boolean };
    }

    return null;

  } catch (error) {
    console.error('Gemini explanation failed:', error);
    return null;
  }
}
