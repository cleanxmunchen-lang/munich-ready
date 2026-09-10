'use client';

import { useI18n } from '@/components/i18n-provider';
import { kits, products } from '@/data/catalog';

export type SavedOrderItem = {
  kind?: 'kit' | 'product';
  id?: string;
  name: string;
  quantity: number;
};

export function OrderItemNames({ items }: { items: SavedOrderItem[] }) {
  const { t } = useI18n();
  const names = items.map((item) => {
    // Older saved orders may only have a name; current orders use stable IDs.
    const kit = Object.values(kits).find((kit) => item.id ? item.kind === 'kit' && kit.id === item.id : kit.name === item.name);
    const product = Object.values(products).find((product) => item.id ? item.kind === 'product' && product.id === item.id : product.name === item.name);
    const name = kit ? t(`kits.names.${kit.id}`) : product ? t(`products.names.${product.id}`) : item.name;
    return `${item.quantity} × ${name}`;
  });

  return <><dt className="mb-2">{t('success.items')}</dt><dd>{names.join(', ')}</dd></>;
}
