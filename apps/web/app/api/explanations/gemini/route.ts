import { NextResponse } from 'next/server';
import { explainWithGemini } from '../../../../lib/ai/explain-with-gemini';
import { getGeminiApiKey } from '../../../../lib/ai/get-gemini-api-key';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return NextResponse.json({ fallback: true, message: 'GEMINI_API_KEY not set.' });
  }

  try {
    const body = await request.json();
    const { query, language, repos } = body;

    // Validate repos
    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid repos attribute.' }, { status: 400 });
    }

    const payload = {
      query,
      language,
      repos: repos.map((repo: any) => ({
        fullName: repo.fullName,
        description: repo.description,
        score: repo.score,
        facts: repo.facts,
        deterministicExplanation: repo.deterministicExplanation,
      })),
    };

    const results = await explainWithGemini(payload, apiKey, { timeoutMs: 8000 });

    if (!results) {
      return NextResponse.json({ fallback: true, message: 'Gemini explanation failed or timed out.' });
    }

    return NextResponse.json({ mode: 'gemini', explanations: results });
  } catch (error) {
    console.error('Error serving Gemini explanation:', error);
    return NextResponse.json({ fallback: true, message: 'Server error processing Gemini explanations.' }, { status: 500 });
  }
}
