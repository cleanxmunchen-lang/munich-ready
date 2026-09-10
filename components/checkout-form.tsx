'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { deliveryOptions, formatPrice, kits, products } from '@/data/catalog';
import { useI18n } from '@/components/i18n-provider';

export function CheckoutForm() {
	const cart = useCart();
	const { t, lang } = useI18n();

	type DeliveryId = 'hotel' | 'priority' | 'express';

	function deliveryLabel(id: DeliveryId | string, fallback: string) {
		switch (id as DeliveryId) {
			case 'hotel':
				return t('checkout.hotelDelivery');
			case 'priority':
				return t('checkout.sameDay');
			case 'express':
				return t('checkout.express');
			default:
				return fallback;
		}
	}
	const [hotel, setHotel] = useState<{ name: string; address?: string } | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (cart.refCode)
			fetch(`/api/hotels/${encodeURIComponent(cart.refCode)}`)
				.then((res) => (res.ok ? res.json() : null))
				.then(setHotel)
				.catch(() => setHotel(null));
	}, [cart.refCode]);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setLoading(true);
		const form = new FormData(event.currentTarget);
		try {
			const response = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					items: cart.items,
					locale: lang,
					deliveryType: cart.deliveryType,
					refCode: cart.refCode,
					customerName: form.get('customerName'),
					roomNumber: form.get('roomNumber'),
					phone: form.get('phone'),
					destination: form.get('destination'),
					specialInstructions: form.get('specialInstructions'),
				}),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error ?? 'Unable to start checkout.');
			window.location.assign(data.url);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Unable to start checkout.');
			setLoading(false);
		}
	}

	if (!cart.items.length)
		return (
			<div className="mt-8 card p-6">
				<p>{t('cart.continueShopping')}</p>
				<Link className="button-primary mt-4" href="/#ready-kits">
					{t('nav.readyKits')}
				</Link>
			</div>
		);

	return (
		<form className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]" onSubmit={submit}>
			<div className="card p-5 sm:p-7">
				<h2 className="text-xl font-bold">{t('checkout.guestName')}</h2>
				<div className="mt-5 grid gap-4">
					<label className="text-sm font-semibold">
						{t('checkout.guestName')}
						<input required name="customerName" className="mt-1 w-full rounded-xl border border-black/15 p-3" autoComplete="name" />
					</label>
					<label className="text-sm font-semibold">
						{t('checkout.phone')}
						<input required name="phone" type="tel" className="mt-1 w-full rounded-xl border border-black/15 p-3" autoComplete="tel" />
					</label>
					<label className="text-sm font-semibold">
						{t('checkout.roomNumber')} <span className="font-normal text-black/50">optional</span>
						<input name="roomNumber" className="mt-1 w-full rounded-xl border border-black/15 p-3" />
					</label>
					{hotel ? (
						<div className="rounded-xl bg-[#e7f0e7] p-4">
							<strong>{t('checkout.deliveryTo').replace('{hotel}', hotel.name)}</strong>
							<p className="mt-1 text-sm">{t('checkout.partnerHotel')}</p>
							<input type="hidden" name="destination" value={hotel.name} />
						</div>
					) : (
						<label className="text-sm font-semibold">
							{t('checkout.destination')}
							<input required name="destination" className="mt-1 w-full rounded-xl border border-black/15 p-3" placeholder={t('checkout.destinationPlaceholder')} />
						</label>
					)}
					<label className="text-sm font-semibold">
						{t('checkout.specialInstructions')} <span className="font-normal text-black/50">optional</span>
						<textarea name="specialInstructions" className="mt-1 min-h-20 w-full rounded-xl border border-black/15 p-3" />
					</label>
				</div>

				<h3 className="mt-7 font-bold">{t('checkout.delivery')}</h3>
				<div className="mt-3 space-y-2">
					{deliveryOptions.map((option) => (
						<label
							key={option.id}
							className={`block cursor-pointer rounded-xl border p-4 ${
								cart.deliveryType === option.id ? 'border-[#184f3a] bg-[#e7f0e7]' : 'border-black/10'
							}`}
						>
							<input className="mr-3" checked={cart.deliveryType === option.id} onChange={() => cart.setDeliveryType(option.id)} type="radio" name="delivery" />
										<strong>
											{deliveryLabel(option.id, option.name)} · {formatPrice(option.price)}
										</strong>
								<span className="ml-6 mt-1 block text-xs text-black/60">{t(`checkout.deliveryDescriptions.${option.id}`)}</span>
						</label>
					))}
				</div>
			</div>

			<aside className="card h-fit p-5 sm:sticky sm:top-4">
				<h2 className="text-xl font-bold">{t('checkout.order')}</h2>
				<div className="mt-4 space-y-3 text-sm">
					{cart.items.map((item, index) => (
						<div className="flex justify-between gap-3" key={`${item.id}-${index}`}>
							<span>
								{t(`${item.kind === 'kit' ? 'kits' : 'products'}.names.${item.id}`)}
								{item.kind === 'kit' && item.cableType ? ` · ${item.cableType === 'usb-c-cable' ? 'USB-C' : 'Lightning'}` : ''}
							</span>
							<strong>{formatPrice((item.kind === 'kit' ? kits[item.id].price : products[item.id].price) * item.quantity)}</strong>
						</div>
					))}
				</div>

				<div className="mt-5 space-y-2 border-t border-black/10 pt-4 text-sm">
					<p className="flex justify-between">
						<span>{t('cart.subtotal')}</span>
						<span>{formatPrice(cart.subtotal)}</span>
					</p>
					<p className="flex justify-between">
						<span>{t('cart.delivery')}</span>
						<span>{formatPrice(cart.deliveryFee)}</span>
					</p>
					<p className="flex justify-between text-base font-bold">
						<span>{t('cart.total')}</span>
						<span>{formatPrice(cart.total)}</span>
					</p>
				</div>
				{error && <p className="mt-4 text-sm text-red-700">{error}</p>}
				<button disabled={loading} className="button-primary mt-5 w-full disabled:opacity-50">
					{loading ? t('checkout.continueToPayment') + '…' : `${t('checkout.continueToPayment')} · ${formatPrice(cart.total)}`}
				</button>
				<p className="mt-3 text-center text-xs text-black/50">{t('checkout.securePayment')}</p>
			</aside>
		</form>
	);
}
