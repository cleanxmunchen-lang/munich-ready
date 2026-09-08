'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useCart } from '@/components/cart-provider';
import { deliveryOptions, formatPrice, kits, products } from '@/data/catalog';

export function CheckoutForm() {
	const cart = useCart();
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
				<p>Your cart is empty.</p>
				<Link className="button-primary mt-4" href="/#ready-kits">
					Browse kits
				</Link>
			</div>
		);

	return (
		<form className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]" onSubmit={submit}>
			<div className="card p-5 sm:p-7">
				<h2 className="text-xl font-bold">Delivery & guest details</h2>
				<div className="mt-5 grid gap-4">
					<label className="text-sm font-semibold">
						Guest name
						<input required name="customerName" className="mt-1 w-full rounded-xl border border-black/15 p-3" autoComplete="name" />
					</label>
					<label className="text-sm font-semibold">
						WhatsApp / phone
						<input required name="phone" type="tel" className="mt-1 w-full rounded-xl border border-black/15 p-3" autoComplete="tel" />
					</label>
					<label className="text-sm font-semibold">
						Room number <span className="font-normal text-black/50">optional</span>
						<input name="roomNumber" className="mt-1 w-full rounded-xl border border-black/15 p-3" />
					</label>
					{hotel ? (
						<div className="rounded-xl bg-[#e7f0e7] p-4">
							<strong>Delivery to: {hotel.name}</strong>
							<p className="mt-1 text-sm">Partner hotel</p>
							<input type="hidden" name="destination" value={hotel.name} />
						</div>
					) : (
						<label className="text-sm font-semibold">
							Hotel or delivery destination
							<input required name="destination" className="mt-1 w-full rounded-xl border border-black/15 p-3" placeholder="Hotel name and address" />
						</label>
					)}
					<label className="text-sm font-semibold">
						Special instructions <span className="font-normal text-black/50">optional</span>
						<textarea name="specialInstructions" className="mt-1 min-h-20 w-full rounded-xl border border-black/15 p-3" />
					</label>
				</div>

				<h3 className="mt-7 font-bold">Delivery option</h3>
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
								{option.name} · {formatPrice(option.price)}
							</strong>
							<span className="ml-6 mt-1 block text-xs text-black/60">{option.description}</span>
						</label>
					))}
				</div>
			</div>

			<aside className="card h-fit p-5 sm:sticky sm:top-4">
				<h2 className="text-xl font-bold">Your order</h2>
				<div className="mt-4 space-y-3 text-sm">
					{cart.items.map((item, index) => (
						<div className="flex justify-between gap-3" key={`${item.id}-${index}`}>
							<span>
								{item.kind === 'kit' ? kits[item.id].name : products[item.id].name}
								{item.kind === 'kit' && item.cableType ? ` · ${item.cableType === 'usb-c-cable' ? 'USB-C' : 'Lightning'}` : ''}
							</span>
							<strong>{formatPrice((item.kind === 'kit' ? kits[item.id].price : products[item.id].price) * item.quantity)}</strong>
						</div>
					))}
				</div>

				<div className="mt-5 space-y-2 border-t border-black/10 pt-4 text-sm">
					<p className="flex justify-between">
						<span>Subtotal</span>
						<span>{formatPrice(cart.subtotal)}</span>
					</p>
					<p className="flex justify-between">
						<span>Delivery</span>
						<span>{formatPrice(cart.deliveryFee)}</span>
					</p>
					<p className="flex justify-between text-base font-bold">
						<span>Total</span>
						<span>{formatPrice(cart.total)}</span>
					</p>
				</div>
				{error && <p className="mt-4 text-sm text-red-700">{error}</p>}
				<button disabled={loading} className="button-primary mt-5 w-full disabled:opacity-50">
					{loading ? 'Taking you to payment…' : `Pay ${formatPrice(cart.total)}`}
				</button>
				<p className="mt-3 text-center text-xs text-black/50">Secure payment through Stripe</p>
			</aside>
		</form>
	);
}
