import { NextResponse } from 'next/server';
import { runScoringSelfTest } from '@sift/shared';

export const runtime = "nodejs";

export async function GET() {
  const result = runScoringSelfTest();
  return NextResponse.json(result);
}
