import { cookies } from 'next/headers';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const COOKIE_NAME = 'sift_github_token';
const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret) throw new Error('AUTH_COOKIE_SECRET is missing');
  // Derive a 32-byte key
  return scryptSync(secret, 'salt', 32);
}

export async function setAuthCookie(token: string) {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const payload = `${iv.toString('hex')}:${authTag}:${encrypted}`;

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: payload,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const key = getKey();
    const parts = cookie.value.split(':');
    if (parts.length !== 3) return null;
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt auth cookie', error);
    return null;
  }
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
