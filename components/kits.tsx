'use client';
import { useState } from 'react';
import Link from 'next/link';
import { kits, products, type KitId, formatPrice } from '@/data/catalog';
import { ProductImage } from '@/components/product-image';
import { useCart } from '@/components/cart-provider';

export function Kits() {
	const { addKit, showToast, setCartOpen } = useCart();
	const [cables, setCables] = useState<Record<string, 'usb-c-cable' | 'lightning-cable'>>({});
	const [added, setAdded] = useState<Record<string, boolean>>({});

	const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	return (
		<section id="kits" className="shell py-12 sm:py-20">
			<p className="eyebrow">MUNICH HOTEL DELIVERY</p>
			<h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Ready-made kits</h2>
			<p className="mt-3 text-sm text-black/65">Choose a curated kit — delivered directly to your hotel.</p>
			<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{(['essential-kit', 'power-kit', 'full-day-kit'] as const).map((kitId) => {
					const kit = kits[kitId];
					return (
						<article key={kit.id} className={`card overflow-hidden p-4 ${kit.id === 'full-day-kit' ? 'ring-2 ring-[#184f3a]' : ''}`}>
							<div className="flex flex-col sm:flex-row gap-4 items-center">
								<div className="w-full sm:w-44 flex-shrink-0">
									<ProductImage src={`/products/${kit.id}.png`} name={kit.name} className="h-36 w-full rounded-2xl bg-[#f7fafcff] p-4" />
								</div>
								<div className="flex-1">
									<div className="flex items-start justify-between gap-3">
										<div>
											<h3 className="text-lg font-bold">{kit.name}</h3>
											<p className="mt-1 text-sm text-black/60">{kit.description}</p>
										</div>
										<div className="text-right">
											<div className="text-sm font-semibold">{formatPrice(kit.price)}</div>
											{kit.id === 'full-day-kit' ? <div className="mt-1 rounded-full bg-[#184f3a] px-2 py-1 text-xs font-bold text-white">BEST VALUE</div> : kit.popular ? <div className="mt-1 rounded-full bg-[#184f3a] px-2 py-1 text-xs font-bold text-white">Most Popular</div> : null}
										</div>
									</div>
									<ul className="mt-3 text-sm text-black/60">
										{kit.productIds.map((id) => <li key={id}>✓ {products[id].name}</li>)}
									</ul>
									{kit.cableChoice && (
										<div className="mt-3 flex gap-2">
											{(['usb-c-cable', 'lightning-cable'] as const).map((type) => (
												<button key={type} onClick={() => setCables({ ...cables, [kit.id]: type })} className={`rounded-full px-3 py-1 text-sm font-semibold ${cables[kit.id] === type ? 'bg-[#184f3a] text-white' : 'bg-white border border-black/10'}`}>
													{type === 'usb-c-cable' ? 'USB-C' : 'Lightning'}
												</button>
											))}
										</div>
									)}
									<div className="mt-4">
										<button
											onClick={() => {
												addKit(kit.id as KitId, cables[kit.id]);
												showToast(`${kit.name} added ✓`);
												setCartOpen(true);
												if (!prefersReducedMotion) {
													setAdded((s) => ({ ...s, [kit.id]: true }));
													window.setTimeout(() => setAdded((s) => ({ ...s, [kit.id]: false })), 1400);
												}
											}}
											className={`button-primary w-full transform transition duration-200 ${added[kit.id] ? 'scale-95' : ''}`}
										>
											{added[kit.id] ? (
												<span className="inline-flex items-center gap-2">
													<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 6.5L5.2 10.7L15 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
													Added
												</span>
											) : (
												'Choose Kit'
											)}
										</button>
									</div>
								</div>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
}
