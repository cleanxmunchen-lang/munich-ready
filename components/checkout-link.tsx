'use client';

import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import { useCart } from '@/components/cart-provider';
import { useI18n } from '@/components/i18n-provider';
import { needsKitCable } from '@/lib/kit-cable';

export function CheckoutLink({ children, className, onProceed }: { children: ReactNode; className: string; onProceed?: () => void }) {
  const { items } = useCart();
  const { t } = useI18n();
  const errorId = useId();
  const missing = items.filter(needsKitCable);

  if (missing.length) return <>
    <p id={errorId} role="status" className="mt-3 text-sm text-red-700">
      {t('cart.cableRequired')} {missing.map(item => t(`kits.names.${item.id}`)).join(', ')}
    </p>
    <button type="button" disabled aria-describedby={errorId} className={`${className} disabled:opacity-50`}>{children}</button>
  </>;

  return <Link href="/checkout" className={className} onClick={onProceed}>{children}</Link>;
}
