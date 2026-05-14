import { NextResponse } from 'next/server';
import { clearAuthCookie } from '../../../../lib/auth/cookies';

export const runtime = "nodejs";

export async function GET(request: Request) {
  await clearAuthCookie();
  
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/', url.origin));
}

export async function POST(request: Request) {
  await clearAuthCookie();
  
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/', url.origin));
}
