import type { RepoExplanation } from "@sift/shared";

export type GeminiExplanationInput = {
  query: string;
  language?: string;
  repos: Array<{
    fullName: string;
    description: string | null;
    score: {
      total: number;
      parts: Record<string, number>;
    };
    facts: {
      stars?: number;
      license?: string | null;
      daysSinceLastCommit?: number | null;
      contributorsCount?: number | null;
      riskPenalty?: number;
      isTutorialLike?: boolean;
      libraryLikenessScore?: number;
    };
    deterministicExplanation: RepoExplanation;
  }>;
};

export async function explainWithGemini(
  input: GeminiExplanationInput,
  apiKey: string,
  options?: { timeoutMs?: number }
): Promise<Record<string, RepoExplanation> | null> {
  const timeoutMs = options?.timeoutMs ?? 8000;

  const prompt = `You are rewriting repository explanations for a search engine.

Rules:
- Ranking and scores are already decided deterministically. NEVER change rank, score, or order.
- Use ONLY the provided facts. Do not invent facts.
- If daysSinceLastCommit > 180, do NOT claim "recent activity".
- If stars < 1000, do NOT claim "strong community adoption".
- If isTutorialLike is true, mention it is tutorial/demo-oriented.
- If license is AGPL/GPL/LGPL, mention copyleft licensing caveat.
- Keep explanations concise and professional.
- Return ONLY valid JSON in this exact shape:

{
  "explanations": {
    "owner/repo": {
      "short": "...",
      "bullets": ["...", "..."],
      "caveats": ["..."]
    }
  }
}

Query: ${input.query}
Language: ${input.language || "any"}

Repos:
${input.repos.map((r, i) => `
${i + 1}. ${r.fullName}
   Description: ${r.description || "N/A"}
   Stars: ${r.facts.stars || 0}
   Days since last commit: ${r.facts.daysSinceLastCommit ?? "unknown"}
   License: ${r.facts.license || "unknown"}
   Tutorial-like: ${r.facts.isTutorialLike ? "yes" : "no"}
   Deterministic explanation: ${JSON.stringify(r.deterministicExplanation)}
`).join("\n")}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1200,
            responseMimeType: "application/json"
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    if (!parsed.explanations || typeof parsed.explanations !== "object") {
      return null;
    }

    // Validate shape
    const result: Record<string, RepoExplanation> = {};
    for (const [key, value] of Object.entries(parsed.explanations)) {
      const v = value as any;
      if (v && typeof v.short === "string" && Array.isArray(v.bullets) && Array.isArray(v.caveats)) {
        result[key] = {
          short: v.short,
          bullets: v.bullets.slice(0, 5),
          caveats: v.caveats.slice(0, 5)
        };
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}
