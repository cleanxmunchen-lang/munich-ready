'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/data/catalog';
import { useI18n } from '@/components/i18n-provider';

export function Header() {
	const { items, total, setCartOpen } = useCart();
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const [open, setOpen] = useState(false);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const menuId = 'mobile-menu';

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
			if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
		}
		document.addEventListener('mousedown', onClick);
		return () => document.removeEventListener('mousedown', onClick);
	}, [open]);

	const { t, lang, setLang } = useI18n();

	return (
		<header className="site-header sticky top-0 z-30 bg-[var(--sand)]/95 backdrop-blur-sm">
			<div className="shell flex h-16 items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/" className="text-lg font-black tracking-tight">MUNICH <span className="text-[#184f3a]">READY</span></Link>
					<nav className="hidden gap-4 text-sm font-semibold sm:flex">
						<Link href="#ready-kits">{t('nav.readyKits')}</Link>
						<Link href="#build-your-kit">{t('nav.buildKit')}</Link>
						<Link href="#how-it-works">{t('nav.howItWorks')}</Link>
						<Link href="#faq">{t('nav.faq')}</Link>
					</nav>
				</div>

				<div className="flex shrink-0 items-center gap-1 min-[360px]:gap-2 min-[769px]:gap-4 whitespace-nowrap">
					<button
						onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
						aria-label={lang === 'en' ? 'Switch to German' : 'Zu Englisch wechseln'}
						className="inline-flex h-11 min-w-12 shrink-0 items-center justify-center rounded-full bg-[#184f3a] p-0 text-white shadow-sm min-[769px]:hidden"
					>
						{t(`langLabels.${lang}`)}
					</button>

					<button
						ref={buttonRef}
						aria-label={open ? 'Close menu' : 'Open menu'}
						aria-expanded={open}
						aria-controls={menuId}
						onClick={() => setOpen((s) => !s)}
						className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white p-2 shadow-sm md:hidden"
					>
						{open ? (
							<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#17201a" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
								<path d="M6 6L18 18M18 6L6 18" />
							</svg>
						) : (
							<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#17201a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
								<path d="M3 12h18M3 6h18M3 18h18" />
							</svg>
						)}
					</button>

					<div className="hidden self-stretch items-stretch gap-2 min-[769px]:flex">
						<button onClick={() => setLang('en')} aria-label="Select English" className={`flex min-w-[52px] shrink-0 items-center justify-center rounded-full p-0 shadow-sm ${lang === 'en' ? 'bg-[#184f3a] text-white' : 'bg-white border border-black/10'}`}>{t('langLabels.en')}</button>
						<button onClick={() => setLang('de')} aria-label="Select German" className={`flex min-w-[52px] shrink-0 items-center justify-center rounded-full p-0 shadow-sm ${lang === 'de' ? 'bg-[#184f3a] text-white' : 'bg-white border border-black/10'}`}>{t('langLabels.de')}</button>
					</div>

					<button aria-label={t('cart.view').replace('{count}', String(itemCount)).replace('{unit}', t(itemCount === 1 ? 'build.item' : 'build.items'))} onClick={() => setCartOpen(true)} className="header-cart inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm">
						<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
							<path d="M3 3h2l.4 2M7 13h10l3-8H6.4" stroke="#17201a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
							<circle cx="10" cy="20" r="1" fill="#17201a" />
							<circle cx="18" cy="20" r="1" fill="#17201a" />
						</svg>
						<span className="hidden sm:inline">{t('nav.cart')}</span>
						{itemCount ? <span className="ml-2 font-bold">{itemCount} · {formatPrice(total)}</span> : null}
						{itemCount > 0 && <span className="mobile-cart-badge hidden" aria-hidden="true">{itemCount}</span>}
					</button>
				</div>
			</div>

			{open && (
				<div id={menuId} ref={panelRef} className="relative z-50 border-t border-black/10 bg-[var(--sand)] shadow-sm md:hidden">
					<nav className="shell flex flex-col py-3">
						<Link href="#ready-kits" onClick={() => setOpen(false)} className="block w-full rounded-md px-3 py-3 text-left text-[#17201a] hover:bg-[#e7f0e7]">{t('nav.readyKits')}</Link>
						<Link href="#build-your-kit" onClick={() => setOpen(false)} className="block w-full rounded-md px-3 py-3 text-left text-[#17201a] hover:bg-[#e7f0e7]">{t('nav.buildKit')}</Link>
						<Link href="#how-it-works" onClick={() => setOpen(false)} className="block w-full rounded-md px-3 py-3 text-left text-[#17201a] hover:bg-[#e7f0e7]">{t('nav.howItWorks')}</Link>
						<Link href="#faq" onClick={() => setOpen(false)} className="block w-full rounded-md px-3 py-3 text-left text-[#17201a] hover:bg-[#e7f0e7]">{t('nav.faq')}</Link>
					</nav>
				</div>
			)}
		</header>
	);
}
