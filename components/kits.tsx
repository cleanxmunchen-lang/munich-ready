'use client';
import { useEffect, useState } from 'react';
import { kits, type KitId, formatPrice } from '@/data/catalog';
import { ProductImage } from '@/components/product-image';
import { useCart } from '@/components/cart-provider';
import { useI18n } from '@/components/i18n-provider';

export function Kits() {
	const { items, addKit, setKitCable, remove, showToast } = useCart();
	const selectedKit = items.find((item) => item.kind === 'kit');
	const [cables, setCables] = useState<Record<string, 'usb-c-cable' | 'lightning-cable'>>({ 'essential-kit': 'usb-c-cable' });
	const [added, setAdded] = useState<Record<string, boolean>>({});

	useEffect(() => {
		if (selectedKit?.cableType) {
			const { id, cableType } = selectedKit;
			setCables((previous) => previous[id] === cableType ? previous : { ...previous, [id]: cableType });
		}
	}, [selectedKit]);

	const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const { t } = useI18n();
	return (
		<section id="ready-kits" className="shell py-12 sm:py-20">
			<p className="eyebrow">{t('hero.eyebrow')}</p>
			<h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">{t('kits.title')}</h2>
			<p className="mt-3 text-sm text-black/65">{t('kits.description')}</p>
			<div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
				{(['essential-kit', 'power-kit', 'full-day-kit'] as const).map((kitId) => {
					const kit = kits[kitId];
					const isSelected = selectedKit?.id === kit.id;
					const cableType = (isSelected ? selectedKit?.cableType : undefined) ?? cables[kit.id];
					return (
						<article
							key={kit.id}
							id={kit.id}
							className={`flex scroll-mt-24 flex-col rounded-2xl border-2 bg-gray-50 overflow-hidden p-4 ${isSelected ? 'border-[#184f3a]' : 'border-gray-100'}`}>
							<div className="w-full flex flex-1 flex-col">
								<ProductImage
									src={`/products/${kit.id}.png`}
									name={kit.name}
									sizes="(max-width: 768px) 300px, (max-width: 1023px) 45vw, 320px"
									className="kit-image aspect-square w-full shrink-0 bg-transparent md:mx-auto md:min-h-[330px] md:max-h-[420px] md:w-[95%]"
								/>
								{/* Content area */}
								<div className="kit-content flex-1 flex flex-col justify-between pt-4">
									<div>
										<h3 className="text-xl font-semibold">{t(`kits.names.${kit.id}`)}</h3>
										<p className="mt-1 text-sm text-black/65">{kit.description}</p>
										{/* optional small line */}
										{kit.id === 'essential-kit' ? (
											<p className="kit-extra mt-2 text-sm text-black/55">{t('kits.extra.essential-kit')}</p>
										) : kit.id === 'full-day-kit' ? (
											<p className="kit-extra mt-2 text-sm text-black/55">{t('kits.extra.full-day-kit')}</p>
										) : null}
									</div>
									<div className="kit-controls mt-4">
										<div className="flex items-center justify-between gap-4">
											<div className="text-lg font-semibold">{formatPrice(kit.price)}</div>
											{kit.id === 'full-day-kit' ? <div className="mt-0 rounded-full bg-[#184f3a] px-3 py-1 text-xs font-bold text-white">{t('kits.badges.bestValue')}</div> : kit.popular ? <div className="mt-0 rounded-full bg-[#184f3a] px-3 py-1 text-xs font-bold text-white">{t('kits.badges.mostPopular')}</div> : null}
										</div>
										{/* Cable selector for kits that need it */}
										{kit.cableChoice && (
											<div className="cable-options mt-3 flex items-center justify-center gap-3">
												{(['usb-c-cable', 'lightning-cable'] as const).map((type) => (
													<button
														key={type}
														aria-pressed={cableType === type}
														onClick={() => {
															setCables((previous) => ({ ...previous, [kit.id]: type }));
															if (isSelected) setKitCable(kit.id, type);
														}}
														className={`rounded-full px-4 py-2 text-sm font-semibold ${cableType === type ? 'bg-[#184f3a] text-white' : 'bg-white border border-black/10'}`}>
														{type === 'usb-c-cable' ? t('kits.usbC') : t('kits.lightning')}
													</button>
												))}
											</div>
										)}
										<div className="mt-4">
											<button
												aria-pressed={isSelected}
												onClick={() => {
												if (isSelected) {
													remove(items.findIndex((item) => item.kind === 'kit' && item.id === kit.id));
													setAdded((previous) => ({ ...previous, [kit.id]: false }));
													showToast(`${kit.name} removed from cart`);
													return;
												}
												addKit(kit.id as KitId, cableType);
												showToast(`${kit.name} added to cart`);
												if (!prefersReducedMotion) {
													setAdded((s) => ({ ...s, [kit.id]: true }));
													window.setTimeout(() => setAdded((s) => ({ ...s, [kit.id]: false })), 1400);
												}
											}}
											className={`button-primary w-full transform transition duration-200 ${added[kit.id] ? 'scale-95' : ''}`}
											>
											{isSelected ? t('kits.selected') : t('kits.choose')}
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
