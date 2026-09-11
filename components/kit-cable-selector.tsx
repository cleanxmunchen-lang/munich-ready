'use client';

import { useId } from 'react';
import { useCart } from '@/components/cart-provider';
import { useI18n } from '@/components/i18n-provider';
import { needsKitCable } from '@/lib/kit-cable';
import type { CheckoutItem } from '@/lib/order';

export function KitCableSelector({ item, disabled = false }: { item: Extract<CheckoutItem, { kind: 'kit' }>; disabled?: boolean }) {
  const { setKitCable } = useCart();
  const { t } = useI18n();
  const errorId = useId();
  const missing = needsKitCable(item);

  return <fieldset disabled={disabled} aria-describedby={missing ? errorId : undefined} className="mt-3 min-w-0">
    <legend className="text-xs font-semibold">{t('kits.cableLabel').replace('{kit}', t(`kits.names.${item.id}`))}</legend>
    <div className="mt-2 flex flex-wrap gap-2">
      {(['usb-c-cable', 'lightning-cable'] as const).map((type) => <button
        type="button" key={type} aria-pressed={item.cableType === type}
        onClick={() => setKitCable(item.id, type)}
        className={`rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 ${item.cableType === type ? 'bg-[#184f3a] text-white' : 'bg-white border border-black/10'}`}>
        {type === 'usb-c-cable' ? t('kits.usbC') : t('kits.lightning')}
      </button>)}
    </div>
    {missing && <p id={errorId} className="mt-2 text-xs text-red-700">{t('kits.cableRequired')}</p>}
  </fieldset>;
}
