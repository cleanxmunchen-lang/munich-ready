import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { Kits } from '@/components/kits';
import { Builder } from '@/components/builder';
import { Footer } from '@/components/footer';
import { ReferralCapture } from '@/components/referral-capture';

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

				<Hero />

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
