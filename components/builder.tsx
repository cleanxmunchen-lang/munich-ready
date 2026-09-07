'use client';
import Link from 'next/link';
import { useState } from 'react';
import { formatPrice, products, type ProductId } from '@/data/catalog';
import { ProductImage } from '@/components/product-image';
import { useCart } from '@/components/cart-provider';

export function Builder() {
	const { setCustom, showToast, setCartOpen } = useCart();
	const [selected, setSelected] = useState<ProductId[]>([]);
	const total = selected.reduce((sum, id) => sum + products[id].price, 0);
	const toggle = (id: ProductId) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
	return (
		<section id="build" className="bg-[#f7faf6] py-12 sm:py-20">
			<div className="shell">
				<p className="eyebrow">Build your own</p>
				<div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row">
					<h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Build Your Kit</h2>
					<div className="rounded-2xl bg-white px-5 py-3 text-right">
						<span className="block text-xs uppercase tracking-wider">Your kit · {selected.length} items</span>
						<strong className="text-xl">{formatPrice(total)}</strong>
					</div>
				</div>

				<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{Object.values(products).map((product) => (
						<button onClick={() => toggle(product.id)} key={product.id} className={`flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition ${selected.includes(product.id) ? 'border-[#184f3a] ring-2 ring-[#184f3a]' : 'border-black/10'}`}>
							<div className="h-28 w-full">
								<ProductImage src={product.image} name={product.name} className="h-28 w-full" />
							</div>
							<div className="p-3">
								<div className="flex items-center justify-between">
									<div className="text-sm font-bold">{product.name}</div>
									<div className="text-sm text-black/60">{formatPrice(product.price)}</div>
								</div>
								<div className="mt-2 text-xs text-black/60">{product.description}</div>
							</div>
						</button>
					))}
				</div>

				<div className="sticky bottom-3 z-30 mt-6 rounded-2xl border border-black/10 bg-white p-3 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
					<p className="text-sm">{selected.length ? `${selected.length} items selected` : 'Select essentials to continue.'}</p>
										<Link href="/checkout" onClick={() => { setCustom(selected); showToast('Custom kit added ✓'); setCartOpen(true); }} className={`button-primary mt-2 w-full sm:mt-0 sm:w-auto ${selected.length ? '' : 'pointer-events-none opacity-50'}`}>
						{selected.length ? `Continue · ${formatPrice(total)}` : 'Continue'}
					</Link>
				</div>
			</div>
		</section>
	);
}
