"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice, kits, products } from '@/data/catalog';
import { useCart } from '@/components/cart-provider';

export function CartDrawer() {
  const { items, subtotal, deliveryFee, total, cartOpen, setCartOpen, remove, setQuantity } = useCart();
  const [bumped, setBumped] = useState<Record<number, boolean>>({});

  const triggerBump = (index: number) => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setBumped((s) => ({ ...s, [index]: true }));
    window.setTimeout(() => setBumped((s) => ({ ...s, [index]: false })), 200);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setCartOpen(false); }
    if (cartOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
      <aside className="relative w-full rounded-t-2xl bg-white p-4 shadow-lg sm:ml-auto sm:mr-6 sm:w-[420px] sm:rounded-3xl sm:my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Your cart</h3>
          <button aria-label="Close cart" className="text-sm text-black/60" onClick={() => setCartOpen(false)}>Close</button>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {items.length === 0 && <p className="text-black/60">Your cart is empty.</p>}
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-semibold">{item.kind === 'kit' ? kits[item.id].name : products[item.id].name}</div>
                {item.kind === 'kit' && item.cableType ? <div className="text-xs text-black/60">{item.cableType === 'usb-c-cable' ? 'USB‑C' : 'Lightning'}</div> : null}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-md border bg-white p-1">
                  <button aria-label={`Decrease quantity of item ${index+1}`} className="px-2 text-sm" onClick={() => { setQuantity(index, item.quantity - 1); triggerBump(index); }}>-</button>
                  <div className={`px-3 text-sm font-semibold transform transition duration-150 ${bumped[index] ? 'scale-105' : 'scale-100'} motion-reduce:transition-none motion-reduce:transform-none`}>{item.quantity}</div>
                  <button aria-label={`Increase quantity of item ${index+1}`} className="px-2 text-sm" onClick={() => { setQuantity(index, item.quantity + 1); triggerBump(index); }}>+</button>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice((item.kind === 'kit' ? kits[item.id].price : products[item.id].price) * item.quantity)}</div>
                  <button className="mt-1 text-xs text-red-600" onClick={() => remove(index)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{formatPrice(deliveryFee)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPrice(total)}</span></div>
        </div>

        <div className="mt-4 grid gap-3">
          <Link href="/checkout" className="button-primary w-full" onClick={() => setCartOpen(false)}>Checkout · {formatPrice(total)}</Link>
          <button className="button-secondary w-full" onClick={() => setCartOpen(false)}>Continue shopping</button>
        </div>
      </aside>
    </div>
  );
}
