import { NextResponse } from "next/server";
import { explainWithGemini, type GeminiExplanationInput } from "../../../../lib/ai/explain-with-gemini";
import type { RepoExplanation } from "@sift/shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, language, repos } = body as GeminiExplanationInput & { repos: any[] };

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        mode: "deterministic",
        explanations: {},
        fallbackCount: repos?.length || 0,
        reason: "GEMINI_API_KEY not configured"
      });
    }

    if (!query || !repos || !Array.isArray(repos)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await explainWithGemini(
      { query, language, repos },
      apiKey,
      { timeoutMs: 8000 }
    );

    if (!result) {
      return NextResponse.json({
        mode: "deterministic",
        explanations: {},
        fallbackCount: repos.length,
        reason: "Gemini rewrite failed or timed out"
      });
    }

    return NextResponse.json({
      mode: "gemini",
      explanations: result,
      fallbackCount: 0
    });
  } catch (err: any) {
    return NextResponse.json({
      mode: "deterministic",
      explanations: {},
      fallbackCount: 0,
      error: "Gemini endpoint error"
    });
  }
}
