'use client';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/cart-provider';

export function AddToCartToast() {
  const { toast } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [toast]);

  if (!toast && !visible) return null;

  return (
    <div className="fixed z-50 left-1/2 bottom-24 -translate-x-1/2 sm:left-auto sm:right-8 sm:bottom-8">
      <div className={`transform transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} motion-reduce:transition-none`}>
        <div className="rounded-full bg-black/90 px-4 py-2 text-white text-sm shadow-lg">{toast}</div>
      </div>
    </div>
  );
}
