import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'munich_ready_admin';
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

export function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  return password?.trim() ? password : null;
}

export function adminPasswordMatches(candidate: string, password: string) {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(candidate), digest(password));
}

function sign(payload: string, password: string) {
  const key = createHmac('sha256', password).update('munich-ready/admin-session/v1').digest();
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function createAdminSession(password: string, now = Math.floor(Date.now() / 1000)) {
  if (!password.trim()) throw new Error('Admin access is not configured.');
  const payload = `v1.${now}.${now + ADMIN_SESSION_SECONDS}.${randomBytes(32).toString('hex')}`;
  return `${payload}.${sign(payload, password)}`;
}

export function verifyAdminSession(token: string | undefined, password: string | null, now = Math.floor(Date.now() / 1000)) {
  if (!password?.trim() || !token) return false;
  const match = /^(v1\.(\d{1,12})\.(\d{1,12})\.[a-f0-9]{64})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const [, payload, issued, expires, signature] = match;
  const issuedAt = Number(issued);
  const expiresAt = Number(expires);
  if (issuedAt > now || expiresAt <= now || expiresAt - issuedAt !== ADMIN_SESSION_SECONDS) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload, password)));
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: ADMIN_SESSION_SECONDS,
    path: '/',
  };
}
