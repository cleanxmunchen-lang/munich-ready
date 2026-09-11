import { kits } from '@/data/catalog';
import type { CheckoutItem } from '@/lib/order';

export function isCableType(value: unknown): value is 'usb-c-cable' | 'lightning-cable' {
  return value === 'usb-c-cable' || value === 'lightning-cable';
}

export function needsKitCable(item: CheckoutItem) {
  return item.kind === 'kit' && kits[item.id].cableChoice && !isCableType(item.cableType);
}
