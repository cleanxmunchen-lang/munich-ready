'use client';
import { formatPrice } from '@/data/catalog';
import { useCart } from '@/components/cart-provider';

export function MiniCart() {
  const { items, total, setCartOpen } = useCart();
  if (!items.length) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[92%] -translate-x-1/2 sm:hidden">
      <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-lg">
        <div>
          <div className="text-sm font-semibold">{items.length} items</div>
          <div className="text-xs text-black/60">Your kit · {formatPrice(total)}</div>
        </div>
        <button className="button-primary" onClick={() => setCartOpen(true)}>View cart</button>
      </div>
    </div>
  );
}
