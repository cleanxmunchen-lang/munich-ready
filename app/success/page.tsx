import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { formatPrice } from '@/data/catalog';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { site } from '@/data/site';
import en from '@/locales/en';

export default async function Success({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
	const sessionId = (await searchParams).session_id;
	if (!sessionId || !supabaseAdmin) redirect('/');

	const { data: order } = await supabaseAdmin
		.from('orders')
		.select('order_number,payment_status,delivery_address,delivery_type,total,items')
		.eq('stripe_session_id', sessionId)
		.maybeSingle();

	if (!order || order.payment_status !== 'paid')
		return (
			<>
				<Header />
				<main className="shell py-24">
					<h1 className="text-4xl font-bold">{en.success.paymentConfirmed}</h1>
					<p className="mt-4 text-black/65">This can take a moment. Please refresh shortly.</p>
					<Link className="button-primary mt-6" href="/">
						{en.success.backHome}
					</Link>
				</main>
				<Footer />
			</>
		);

	const itemNames = (order.items as { name: string; quantity: number }[]).map((item) => `${item.quantity} × ${item.name}`);

	return (
		<>
			<Header />
			<main className="shell py-14 sm:py-24">
				<div className="mx-auto max-w-xl rounded-3xl bg-[#e7f0e7] p-7 sm:p-10">
					<p className="eyebrow">{en.success.paymentConfirmed}</p>
					<h1 className="mt-2 text-4xl font-bold">{en.success.title}</h1>
					<p className="mt-3 text-black/65">Your order has been received. We’ll prepare your order and deliver it to your hotel.</p>

					<dl className="mt-8 space-y-3 rounded-2xl bg-white p-5 text-sm">
						<div className="flex justify-between gap-3">
							<dt>Order number</dt>
							<dd className="font-bold">{order.order_number}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt>Destination</dt>
							<dd className="text-right font-bold">{order.delivery_address}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt>Delivery</dt>
							<dd className="font-bold">{order.delivery_type}</dd>
						</div>
						<div className="flex justify-between gap-3">
							<dt>Paid</dt>
							<dd className="font-bold">{formatPrice(order.total)}</dd>
						</div>
						<div>
							<dt className="mb-2">Items</dt>
							<dd>{itemNames.join(', ')}</dd>
						</div>
					</dl>

					<a className="button-primary mt-6 w-full" href={`https://wa.me/${site.whatsappNumber}`}>
						Contact us on WhatsApp
					</a>
				</div>
			</main>
			<Footer />
		</>
	);
}
