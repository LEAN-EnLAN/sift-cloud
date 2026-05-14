import { getAuthCookie } from '../auth/cookies';

export async function getGithubAuthInfo(): Promise<{ token?: string, source: 'oauth' | 'env' | 'anonymous' }> {
  // 1. Check user OAuth token from httpOnly cookie
  const oauthToken = await getAuthCookie();
  if (oauthToken) {
    return { token: oauthToken, source: 'oauth' };
  }

  // 2. Fallback to env GITHUB_TOKEN
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    return { token: envToken, source: 'env' };
  }

  // 3. Anonymous
  return { token: undefined, source: 'anonymous' };
}
