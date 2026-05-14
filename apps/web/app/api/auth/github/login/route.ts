import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export const runtime = "nodejs";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL('/?auth_error=oauth_not_configured', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  }

  const state = randomBytes(16).toString('hex');
  const cookieStore = await cookies();
  
  cookieStore.set({
    name: 'github_oauth_state',
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('state', state);
  // scope empty or minimal, do NOT request repo scope

  return NextResponse.redirect(githubAuthUrl.toString());
}
