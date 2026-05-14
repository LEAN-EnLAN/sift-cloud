import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './get-gemini-api-key';

export async function generateGithubQueries(
  query: string, 
  language?: string
): Promise<{ variants: string[], keywords: string[], domain: string } | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a technical assistant optimized for GitHub search. 
The user is looking for a library, tool, or framework.
Convert their intent into up to 4 exact GitHub search queries.

Rules:
1. Always append "fork:false archived:false" to every query.
2. If language is provided, append "language:${language}" to every query.
3. Include standard search terms and synonyms.
4. Extract the main keywords.
5. Identify the domain (e.g., "auth", "orm", "pdf", "ui", "general").

User Query: "${query}"
Language: "${language || 'any'}"

Return strictly valid JSON with this schema:
{
  "variants": ["query1", "query2"],
  "keywords": ["keyword1", "keyword2"],
  "domain": "detected-domain"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const textPayload = response.text;
    if (!textPayload) return null;

    const parsed = JSON.parse(textPayload);
    return {
      variants: Array.isArray(parsed.variants) ? parsed.variants.slice(0, 4) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      domain: parsed.domain || 'general'
    };
  } catch (err) {
    console.error('Error generating GitHub queries from LLM:', err);
    return null;
  }
}
