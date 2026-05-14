import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setAuthCookie } from '../../../../../lib/auth/cookies';

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const baseUrl = request.nextUrl.origin;

  const cookieStore = await cookies();
  const storedState = cookieStore.get('github_oauth_state')?.value;

  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/?auth_error=invalid_state', baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?auth_error=missing_code', baseUrl));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/?auth_error=oauth_not_configured', baseUrl));
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const data = await tokenResponse.json();

    if (data.error) {
      throw new Error(`GitHub auth error: ${data.error_description || data.error}`);
    }

    if (!data.access_token) {
       throw new Error('No access token returned');
    }

    // Set the encrypted cookie
    await setAuthCookie(data.access_token);
    
    // Clear state
    cookieStore.delete('github_oauth_state');

    return NextResponse.redirect(new URL('/?auth=github_connected', baseUrl));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?auth_error=token_exchange_failed', baseUrl));
  }
}
