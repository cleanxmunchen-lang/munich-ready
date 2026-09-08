'use client';
import Link from 'next/link';
import { useState } from 'react';
import { formatPrice, products, type ProductId } from '@/data/catalog';
import { ProductImage } from '@/components/product-image';
import { useCart } from '@/components/cart-provider';

export function Builder() {
	const { items, addProduct, setQuantity, subtotal, showToast } = useCart();
	const [added, setAdded] = useState<Record<string, boolean>>({});

	const findIndex = (id: ProductId) => items.findIndex((it) => it.kind === 'product' && it.id === id);

	return (
		<section id="build" className="bg-[#f7faf6] py-12 sm:py-20">
			<div className="shell">
				<p className="eyebrow">Build your own</p>
				<div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row">
					<h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Build Your Kit</h2>
					<div className="rounded-2xl bg-white px-5 py-3 text-right">
						<span className="block text-xs uppercase tracking-wider">Your kit · {items.filter(i => i.kind === 'product').reduce((s, it) => s + it.quantity, 0)} items</span>
						<strong className="text-xl">{formatPrice(subtotal)}</strong>
					</div>
				</div>

				<div className="mt-6 lg:flex lg:gap-6">
					<div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
						{Object.values(products).map((product) => {
							const idx = findIndex(product.id as ProductId);
							const inCart = idx >= 0 ? items[idx].quantity : 0;
							return (
								<div key={product.id} className={`flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition border-black/10`}>
									<div className="h-36 w-full p-4">
										<ProductImage src={product.image} name={product.name} className="h-full w-full" />
									</div>
									<div className="p-3 flex flex-wrap items-center justify-between gap-2">
										<div>
											<div className="text-sm font-bold">{product.name}</div>
											<div className="mt-1 text-xs text-black/60">{formatPrice(product.price)}</div>
										</div>
										<div>
											{inCart && !added[product.id] ? (
												<div className="flex items-center gap-2">
													<button className="px-3 py-1 rounded border" onClick={() => setQuantity(idx, inCart - 1)} aria-label={`Decrease ${product.name}`}>-</button>
													<div className="px-3">{inCart}</div>
													<button className="px-3 py-1 rounded border" onClick={() => { setQuantity(idx, inCart + 1); showToast(`${product.name} added to cart. Quantity: ${inCart + 1}`); }} aria-label={`Increase ${product.name}`}>+</button>
												</div>
											) : (
												<button
													disabled={added[product.id]}
													className={`button-primary whitespace-nowrap transform transition duration-200 motion-reduce:transform-none motion-reduce:transition-none ${added[product.id] ? 'scale-95' : ''}`}
													onClick={() => {
														addProduct(product.id as ProductId);
														showToast(`${product.name} added to cart`);
														setAdded((s) => ({ ...s, [product.id]: true }));
														window.setTimeout(() => setAdded((s) => ({ ...s, [product.id]: false })), 1400);
													}}
												>
													{added[product.id] ? 'Added ✓' : 'Add'}
												</button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<aside className="hidden w-80 shrink-0 lg:block">
						<div className="sticky top-24 rounded-2xl border border-black/10 bg-white p-5">
							<h3 className="text-lg font-bold">Your Kit</h3>
							<div className="mt-4 space-y-3 text-sm">
								{items.filter(i => i.kind === 'product').length === 0 && <p className="text-black/60">No items yet.</p>}
								{items.filter(i => i.kind === 'product').map((item, index) => (
									<div key={`${item.id}-${index}`} className="flex items-center justify-between">
										<div>
											<div className="font-semibold">{products[item.id].name}</div>
											<div className="text-xs text-black/60">{formatPrice(products[item.id].price)} each</div>
										</div>
										<div className="text-right">
											<div className="font-semibold">{formatPrice(products[item.id].price * item.quantity)}</div>
											<div className="text-xs text-black/60">{item.quantity} × {formatPrice(products[item.id].price)}</div>
										</div>
									</div>
								))}
							</div>
							<div className="mt-5 border-t border-black/10 pt-4">
								<div className="flex justify-between"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
								<Link href="/checkout" className="button-primary mt-4 w-full">Continue to Checkout</Link>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</section>
	);
}
