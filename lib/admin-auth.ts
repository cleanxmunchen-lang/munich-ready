import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, getAdminPassword, verifyAdminSession } from '@/lib/admin-session';

export async function getAdminAuthStatus() {
  const password = getAdminPassword();
  if (!password) return 'unconfigured';
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSession(token, password) ? 'authenticated' : 'unauthenticated';
}

export async function requireAdmin() {
  const status = await getAdminAuthStatus();
  if (status === 'unconfigured') throw new Error('Admin access is not configured.');
  if (status === 'unauthenticated') redirect('/admin/login');
}
