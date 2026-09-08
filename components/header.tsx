'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/data/catalog';

export function Header() {
	const { items, total, setCartOpen } = useCart();
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const [open, setOpen] = useState(false);
	const panelRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') setOpen(false);
		}
		if (open) document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open]);

	useEffect(() => {
		function onClick(e: MouseEvent) {
			if (!open) return;
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener('mousedown', onClick);
		return () => document.removeEventListener('mousedown', onClick);
	}, [open]);

	return (
		<header className="site-header sticky top-0 z-30 bg-[var(--sand)]/95 backdrop-blur-sm">
			<div className="shell flex h-16 items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/" className="text-lg font-black tracking-tight">MUNICH <span className="text-[#184f3a]">READY</span></Link>
					<nav className="hidden gap-4 text-sm font-semibold sm:flex">
						<Link href="#ready-kits">Ready Kits</Link>
						<Link href="#build-your-kit">Build Your Kit</Link>
						<Link href="#how-it-works">How It Works</Link>
						<Link href="#faq">FAQ</Link>
					</nav>
				</div>

				<div className="flex items-center gap-2">
					{/* Mobile menu button (visible on mobile only) */}
					<button
						aria-label="Open menu"
						onClick={() => setOpen((s) => !s)}
						className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white p-2 shadow-sm md:hidden"
					>
						<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#17201a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
							<path d="M3 12h18M3 6h18M3 18h18" />
						</svg>
					</button>

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

			{/* Mobile nav panel */}
			{open && (
				<div className="fixed inset-0 z-40 md:hidden">
					<div className="absolute inset-0 bg-black/30" />
					<div ref={panelRef} className="absolute right-4 top-16 w-[88%] max-w-xs rounded-xl bg-white border border-black/5 shadow-lg p-2">
						<nav className="flex flex-col">
							<a href="#ready-kits" onClick={() => setOpen(false)} className="block w-full text-left text-[#17201a] py-3 px-3 rounded-md hover:bg-[#e7f0e7]">Ready Kits</a>
							<a href="#build-your-kit" onClick={() => setOpen(false)} className="block w-full text-left text-[#17201a] py-3 px-3 rounded-md hover:bg-[#e7f0e7]">Build Your Kit</a>
							<a href="#how-it-works" onClick={() => setOpen(false)} className="block w-full text-left text-[#17201a] py-3 px-3 rounded-md hover:bg-[#e7f0e7]">How It Works</a>
							<a href="#faq" onClick={() => setOpen(false)} className="block w-full text-left text-[#17201a] py-3 px-3 rounded-md hover:bg-[#e7f0e7]">FAQ</a>
						</nav>
					</div>
				</div>
			)}
		</header>
	);
}
