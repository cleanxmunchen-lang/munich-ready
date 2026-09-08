'use client';
import { formatPrice } from '@/data/catalog';
import { useCart } from '@/components/cart-provider';

export function MiniCart() {
  const { items, total, setCartOpen } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  if (!items.length) return null;
  return (
    <>
      <div aria-hidden="true" className="h-[calc(6rem+env(safe-area-inset-bottom))] sm:hidden" />
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[92%] -translate-x-1/2 sm:hidden">
        <button type="button" onClick={() => setCartOpen(true)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left shadow-lg focus:outline-none focus:ring-2 focus:ring-[#184f3a] focus:ring-offset-2">
          <span>
            <span className="block text-sm font-semibold">Your Kit</span>
            <span className="block text-xs text-black/60">{itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatPrice(total)}</span>
          </span>
          <span className="button-primary shrink-0">View Cart</span>
        </button>
      </div>
    </>
  );
}
