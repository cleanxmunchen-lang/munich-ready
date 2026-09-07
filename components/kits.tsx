'use client';
import { useState } from 'react';
import Link from 'next/link';
import { kits, products, type KitId, formatPrice } from '@/data/catalog';
import { ProductImage } from '@/components/product-image';
import { useCart } from '@/components/cart-provider';

export function Kits() {
	const { addKit, showToast, setCartOpen } = useCart();
	const [cables, setCables] = useState<Record<string, 'usb-c-cable' | 'lightning-cable'>>({});
	return (
		<section id="kits" className="shell py-12 sm:py-20">
			<p className="eyebrow">MUNICH HOTEL DELIVERY</p>
			<h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Ready-made kits</h2>
			<p className="mt-3 text-sm text-black/65">Select a curated kit and we deliver directly to your hotel.</p>
			<div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{Object.values(kits).map((kit) => (
					<article key={kit.id} className="card overflow-hidden p-4">
						<div className="flex gap-4">
							<div className="w-36 flex-shrink-0">
								<ProductImage src={`/kits/${kit.id}.jpg`} name={kit.name} className="h-28 w-full rounded-2xl" />
							</div>
							<div className="flex flex-1 flex-col">
								<div className="flex items-start justify-between gap-3">
									<div>
										<h3 className="text-lg font-bold">{kit.name}</h3>
										<p className="mt-1 text-sm text-black/60">{kit.description}</p>
									</div>
									<div className="text-right">
										<div className="text-sm font-semibold">{formatPrice(kit.price)}</div>
										{kit.popular ? <div className="mt-1 rounded-full bg-[#184f3a] px-2 py-1 text-xs font-bold text-white">Most Popular</div> : null}
									</div>
								</div>
								<ul className="mt-3 flex-1 text-sm text-black/60">
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
									<button onClick={() => { addKit(kit.id as KitId, cables[kit.id]); showToast(`${kit.name} added ✓`); setCartOpen(true); }} className="button-primary w-full">Add {kit.name}</button>
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
