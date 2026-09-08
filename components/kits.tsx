'use client';
import { useState } from 'react';
import { kits, type KitId, formatPrice } from '@/data/catalog';
import { ProductImage } from '@/components/product-image';
import { useCart } from '@/components/cart-provider';

export function Kits() {
	const { items, addKit, showToast, setCartOpen } = useCart();
	const selectedKitId = items.find((item) => item.kind === 'kit')?.id;
	const [cables, setCables] = useState<Record<string, 'usb-c-cable' | 'lightning-cable'>>({ 'essential-kit': 'usb-c-cable' });
	const [added, setAdded] = useState<Record<string, boolean>>({});

	const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	return (
		<section id="kits" className="shell py-12 sm:py-20">
			<p className="eyebrow">MUNICH HOTEL DELIVERY</p>
			<h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">Ready-made kits</h2>
			<p className="mt-3 text-sm text-black/65">Choose a curated kit — delivered directly to your hotel.</p>
			<div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
				{(['essential-kit', 'power-kit', 'full-day-kit'] as const).map((kitId) => {
					const kit = kits[kitId];
					const isSelected = selectedKitId === kit.id;
					return (
						<article
							key={kit.id}
							className={`flex flex-col rounded-2xl border-2 bg-gray-50 overflow-hidden p-4 ${isSelected ? 'border-[#184f3a]' : 'border-gray-100'}`}>
							<div className="w-full flex flex-1 flex-col">
								<ProductImage
									src={`/products/${kit.id}.png`}
									name={kit.name}
									className="aspect-square w-full shrink-0 bg-transparent md:mx-auto md:min-h-[330px] md:max-h-[420px] md:w-[95%]"
								/>
								{/* Content area */}
								<div className="flex-1 flex flex-col justify-between pt-4">
									<div>
										<h3 className="text-xl font-semibold">{kit.name}</h3>
										<p className="mt-1 text-sm text-black/65">{kit.description}</p>
										{/* optional small line */}
										{kit.id === 'essential-kit' ? (
											<p className="mt-2 text-sm text-black/55">5 essentials included</p>
										) : kit.id === 'full-day-kit' ? (
											<p className="mt-2 text-sm text-black/55">Everything for a full festival day</p>
										) : null}
									</div>
									<div className="mt-4">
										<div className="flex items-center justify-between gap-4">
											<div className="text-lg font-semibold">{formatPrice(kit.price)}</div>
											{kit.id === 'full-day-kit' ? <div className="mt-0 rounded-full bg-[#184f3a] px-3 py-1 text-xs font-bold text-white">BEST VALUE</div> : kit.popular ? <div className="mt-0 rounded-full bg-[#184f3a] px-3 py-1 text-xs font-bold text-white">MOST POPULAR</div> : null}
										</div>
										{/* Cable selector for kits that need it */}
										{kit.cableChoice && (
											<div className="mt-3 flex items-center justify-center gap-3">
												{(['usb-c-cable', 'lightning-cable'] as const).map((type) => (
													<button
														key={type}
														onClick={() => setCables({ ...cables, [kit.id]: type })}
														className={`rounded-full px-4 py-2 text-sm font-semibold ${cables[kit.id] === type ? 'bg-[#184f3a] text-white' : 'bg-white border border-black/10'}`}>
														{type === 'usb-c-cable' ? 'USB-C' : 'Lightning'}
													</button>
												))}
											</div>
										)}
										<div className="mt-4">
											<button
												aria-pressed={isSelected}
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
											{isSelected ? '✓ Selected' : 'Choose Kit'}
											</button>
										</div>
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
