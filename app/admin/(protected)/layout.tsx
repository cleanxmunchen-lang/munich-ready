import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>
    <header className="admin-header border-b bg-white">
      <div className="shell flex min-h-16 flex-wrap items-center gap-x-5 gap-y-1 py-3 sm:py-0">
        <Link href="/admin/orders" className="admin-brand whitespace-nowrap font-black">MUNICH <span>READY</span> <span className="admin-brand-label">ADMIN</span></Link>
        <nav aria-label="Admin navigation" className="ml-auto flex items-center gap-1 text-sm font-semibold sm:gap-2">
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/hotels">Hotels</Link>
          <form action="/api/admin/logout" method="post"><button type="submit">Logout</button></form>
        </nav>
      </div>
    </header>
    <main className="admin-shell shell py-8">{children}</main>
  </>;
}
