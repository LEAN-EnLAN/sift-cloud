import { NextResponse } from 'next/server';
import { buildQueryVariants, normalizeQuery } from '@sift/shared';

export const runtime = "nodejs";

export async function GET() {
  try {
    // Basic test if the shared library can be imported and executed
    const testResult = buildQueryVariants({ query: "test" });
    const normalizeResult = normalizeQuery("cómo edito PDFs en Python");

    return NextResponse.json({
      ok: true,
      app: "sift",
      mode: "next-only-preview",
      sharedIntelligenceImportOk: !!testResult,
      normalizeQueryOk: normalizeResult === "edit pdf python",
      githubTokenDetected: !!process.env.GITHUB_TOKEN
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      app: "sift",
      mode: "next-only-preview",
      sharedIntelligenceImportOk: false,
      normalizeQueryOk: false,
      githubTokenDetected: !!process.env.GITHUB_TOKEN,
      error: String(error)
    }, { status: 500 });
  }
}
