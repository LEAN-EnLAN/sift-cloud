import { NextResponse } from 'next/server';
import { getAuthCookie } from '../../../../lib/auth/cookies';

export const runtime = "nodejs";

export async function GET() {
  const token = await getAuthCookie();
  const oauthConfigured = !!(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_OAUTH_REDIRECT_URI &&
    process.env.AUTH_COOKIE_SECRET
  );

  return NextResponse.json({
    loggedIn: !!token,
    provider: token ? 'github' : null,
    oauthConfigured,
    tokenSourceAvailable: {
      oauthCookie: !!token,
      envGithubToken: !!process.env.GITHUB_TOKEN,
    }
  });
}
