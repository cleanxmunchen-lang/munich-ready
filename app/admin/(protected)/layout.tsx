import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>
    <header className="border-b border-black/10 bg-white">
      <div className="shell flex h-16 items-center gap-5">
        <Link href="/admin/orders" className="font-black">MUNICH READY <span className="text-[#184f3a]">ADMIN</span></Link>
        <nav className="ml-auto flex gap-4 text-sm font-semibold">
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/hotels">Hotels</Link>
          <form action="/api/admin/logout" method="post"><button type="submit">Logout</button></form>
        </nav>
      </div>
    </header>
    <main className="shell py-8">{children}</main>
  </>;
}
