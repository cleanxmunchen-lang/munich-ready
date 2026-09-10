import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_COOKIE, adminCookieOptions, adminPasswordMatches, createAdminSession, getAdminPassword } from '@/lib/admin-session';

export async function POST(request: Request) {
  const password = getAdminPassword();
  if (!password) return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });

  const input = z.object({ password: z.string().max(4096) }).safeParse(await request.json().catch(() => null));
  if (!input.success || !adminPasswordMatches(input.data.password, password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(password), adminCookieOptions());
  return response;
}
