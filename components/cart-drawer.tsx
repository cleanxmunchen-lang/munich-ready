"use client";
import { CheckoutLink } from '@/components/checkout-link';
import { KitCableSelector } from '@/components/kit-cable-selector';
import { useEffect, useRef, useState } from 'react';
import { formatPrice, kits, products } from '@/data/catalog';
import { useCart } from '@/components/cart-provider';
import { useI18n } from '@/components/i18n-provider';

export function CartDrawer() {
  const { t } = useI18n();
  const { items, subtotal, deliveryFee, total, cartOpen, setCartOpen, remove, setQuantity } = useCart();
  const [bumped, setBumped] = useState<Record<number, boolean>>({});
  const dialogRef = useRef<HTMLElement>(null);

  const triggerBump = (index: number) => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setBumped((s) => ({ ...s, [index]: true }));
    window.setTimeout(() => setBumped((s) => ({ ...s, [index]: false })), 200);
  };

  useEffect(() => {
    if (!cartOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCartOpen(false);
      if (e.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? []);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center">
      <div aria-hidden="true" className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
      <aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cart-heading" className="cart-dialog relative w-full rounded-t-2xl bg-white p-4 shadow-lg sm:ml-auto sm:mr-6 sm:w-[420px] sm:rounded-3xl sm:my-8">
        <div className="flex items-center justify-between">
          <h3 id="cart-heading" className="text-lg font-bold">{t('cart.title')}</h3>
          <button aria-label={t('cart.closeLabel')} className="cart-close text-sm text-black/60" onClick={() => setCartOpen(false)}>{t('cart.close')}</button>
        </div>
        <div className="cart-items mt-4 space-y-3 text-sm">
          {items.length === 0 && <p className="text-black/60">{t('cart.empty')}</p>}
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="cart-item flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-semibold">{t(`${item.kind === 'kit' ? 'kits' : 'products'}.names.${item.id}`)}</div>
                {item.kind === 'kit' && kits[item.id].cableChoice ? <KitCableSelector item={item} /> : null}
              </div>
              <div className="cart-item-controls flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-md border bg-white p-1">
                  <button aria-label={t('cart.decrease').replace('{name}', t(`${item.kind === 'kit' ? 'kits' : 'products'}.names.${item.id}`))} className="px-2 text-sm" onClick={() => { setQuantity(index, item.quantity - 1); triggerBump(index); }}>-</button>
                  <div className={`px-3 text-sm font-semibold transform transition duration-150 ${bumped[index] ? 'scale-105' : 'scale-100'} motion-reduce:transition-none motion-reduce:transform-none`}>{item.quantity}</div>
                  <button aria-label={t('cart.increase').replace('{name}', t(`${item.kind === 'kit' ? 'kits' : 'products'}.names.${item.id}`))} className="px-2 text-sm" onClick={() => { setQuantity(index, item.quantity + 1); triggerBump(index); }}>+</button>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice((item.kind === 'kit' ? kits[item.id].price : products[item.id].price) * item.quantity)}</div>
                  <button className="mt-1 text-xs text-red-600" onClick={() => remove(index)}>{t('cart.remove')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 border-t border-black/10 pt-4 text-sm">
          <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span>{t('cart.delivery')}</span><span>{formatPrice(deliveryFee)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>{t('cart.total')}</span><span>{formatPrice(total)}</span></div>
        </div>

        <div className="mt-4 grid gap-3">
          <CheckoutLink className="button-primary w-full" onProceed={() => setCartOpen(false)}>{t('cart.checkout')} · {formatPrice(total)}</CheckoutLink>
          <button className="button-secondary w-full" onClick={() => setCartOpen(false)}>{t('cart.continueShopping')}</button>
        </div>
      </aside>
    </div>
  );
}
