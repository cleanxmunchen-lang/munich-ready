import Link from 'next/link';
import { Header } from '@/components/header';
import { Kits } from '@/components/kits';
import { Builder } from '@/components/builder';
import { Footer } from '@/components/footer';
import { ReferralCapture } from '@/components/referral-capture';
import { ProductImage } from '@/components/product-image';

const faqs = [
	['Can you deliver directly to my hotel?', 'Yes. Orders can be delivered to participating hotel receptions or the agreed delivery location.'],
	['How fast is delivery?', 'Delivery options depend on location and current demand. Same-day and express options may be available.'],
	['What bag size can I bring?', 'Our compact bags are selected with official festival bag-size limits in mind. Final admission is always subject to venue security checks.'],
	['Can I choose my charging cable?', 'Yes. USB-C and Lightning options are available.'],
	['Do I need to stay in my room?', 'Usually not. Where accepted by the hotel, the order can be left at reception.'],
	['How can I pay?', 'Online payment through Stripe is supported.']
];

export default async function Home({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
	const { ref } = await searchParams;
	return (
		<>
			<Header />
			<main>
				<ReferralCapture ref={ref} />

				<section className="shell py-12 sm:py-20">
					<div className="grid gap-6 sm:grid-cols-2 items-center">
						<div>
							<p className="eyebrow">MUNICH HOTEL DELIVERY</p>
							<h1 className="mt-3 max-w-xl text-4xl font-bold tracking-[-.02em] sm:text-5xl">Everything you need for your festival day.</h1>
							<p className="mt-4 max-w-lg text-base leading-7 text-black/65">Travel and festival essentials delivered directly to your hotel in Munich.</p>
							<p className="mt-2 text-sm text-black/60">Small bags • Power banks • Rain protection • Blister care</p>
							<div className="mt-6 flex flex-col gap-3 sm:flex-row">
								<Link className="button-primary" href="#kits">Shop Ready Kits</Link>
								<Link className="button-secondary" href="#build">Build Your Own Kit</Link>
							</div>
							<div className="mt-6 flex gap-3 text-sm">
								<div className="rounded-xl bg-white px-3 py-2">Hotel delivery</div>
								<div className="rounded-xl bg-white px-3 py-2">Secure online payment</div>
								<div className="rounded-xl bg-white px-3 py-2">No account required</div>
							</div>
						</div>
						<div className="hidden sm:block">
							<div className="grid gap-3">
								<div className="flex gap-3">
									<ProductImage src="/kits/power-kit.jpg" name="Power Kit" className="h-40 w-40" />
									<ProductImage src="/kits/essential-kit.jpg" name="Essential Kit" className="h-40 w-40" />
								</div>
								<div className="w-full">
									<ProductImage src="/kits/full-day-kit.jpg" name="Full Day Kit" className="h-44 w-full" />
								</div>
							</div>
						</div>
					</div>
				</section>

				<Kits />
				<Builder />

				<section id="how" className="shell py-14 sm:py-20">
					<p className="eyebrow">How it works</p>
					<h2 className="mt-2 text-3xl font-bold sm:text-5xl">From scan to ready.</h2>
					<div className="mt-8 grid gap-4 sm:grid-cols-3">
						{[['01', 'Choose your kit'], ['02', 'Pay online'], ['03', 'We deliver to your hotel']].map(([number, text]) => (
							<div className="card p-6" key={number}>
								<span className="text-3xl font-black text-[#184f3a]">{number}</span>
								<p className="mt-6 text-lg font-bold">{text}</p>
							</div>
						))}
					</div>
				</section>

				<section id="faq" className="shell pb-16">
					<p className="eyebrow">Questions</p>
					<h2 className="mt-2 text-3xl font-bold sm:text-5xl">Helpful, before you order.</h2>
					<div className="mt-8 divide-y divide-black/10 rounded-3xl border border-black/10 bg-white">
						{faqs.map(([question, answer]) => (
							<details className="p-5" key={question}>
								<summary className="cursor-pointer font-bold">{question}</summary>
								<p className="mt-3 max-w-2xl text-sm leading-6 text-black/65">{answer}</p>
							</details>
						))}
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}
