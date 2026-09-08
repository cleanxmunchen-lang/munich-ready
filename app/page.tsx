import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { Kits } from '@/components/kits';
import { Builder } from '@/components/builder';
import { Footer } from '@/components/footer';
import { ReferralCapture } from '@/components/referral-capture';

const steps = [
	{
		number: '01',
		title: 'Choose your kit',
		description: 'Pick a ready-made kit or build your own.',
		support: 'Fast, simple, no account required.',
		icon: 'M5 7h14l1 14H4L5 7ZM8 9V6a4 4 0 0 1 8 0v3'
	},
	{
		number: '02',
		title: 'Pay online',
		description: 'Pay securely online in seconds.',
		support: 'Card • Apple Pay • Google Pay',
		icon: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM2 9h20M6 15h4'
	},
	{
		number: '03',
		title: 'Hotel delivery',
		description: 'We deliver your order directly to your hotel reception.',
		support: 'Ready for you at reception.',
		icon: 'M4 21V3h12v18M2 21h20M16 9h4v12M8 7h4M8 11h4M8 15h4M8 21v-3h4v3'
	}
];

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
					<ol role="list" className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-8">
						{steps.map(({ number, title, description, support, icon }, index) => (
							<li className="relative min-w-0" key={number}>
								<article className="card flex h-full flex-col p-5 transition duration-200 sm:hover:-translate-y-0.5 sm:hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
									<div className="flex items-center justify-between gap-4">
										<span className="text-3xl font-black leading-none text-[#184f3a]"><span className="sr-only">Step </span>{number}</span>
										<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f0e7] text-[#184f3a]">
											<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
												<path d={icon} />
											</svg>
										</div>
									</div>
									<h3 className="mt-3 text-lg font-bold">{title}</h3>
									<p className="mt-1 text-sm leading-6 text-black/65">{description}</p>
									<p className="mt-auto pt-3 text-xs leading-5 text-black/55">{support}</p>
								</article>
								{index < steps.length - 1 && (
									<svg className="pointer-events-none absolute -right-6 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-[#184f3a]/40 sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
										<path d="M4 12h16m-5-5 5 5-5 5" />
									</svg>
								)}
							</li>
						))}
					</ol>
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
