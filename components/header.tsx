'use client';
import Link from 'next/link';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/data/catalog';

export function Header() {
	const { items, total, setCartOpen } = useCart();
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	return (
		<header className="site-header sticky top-0 z-30 bg-[var(--sand)]/95 backdrop-blur-sm">
			<div className="shell flex h-16 items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/" className="text-lg font-black tracking-tight">MUNICH <span className="text-[#184f3a]">READY</span></Link>
					<nav className="hidden gap-4 text-sm font-semibold sm:flex">
						<Link href="#kits">Ready Kits</Link>
						<Link href="#build">Build Your Kit</Link>
						<Link href="#how">How It Works</Link>
						<Link href="#faq">FAQ</Link>
					</nav>
				</div>
				<div className="flex items-center gap-3">
					<button aria-label={`View cart (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`} onClick={() => setCartOpen(true)} className="header-cart inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm">
						<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
							<path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="#17201a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
							<circle cx="10" cy="20" r="1" fill="#17201a" />
							<circle cx="18" cy="20" r="1" fill="#17201a" />
						</svg>
						<span className="hidden sm:inline">Cart</span>
						{itemCount ? <span className="ml-2 font-bold">{itemCount} · {formatPrice(total)}</span> : null}
						{itemCount > 0 && <span className="mobile-cart-badge hidden" aria-hidden="true">{itemCount}</span>}
					</button>
				</div>
			</div>
		</header>
	);
}
