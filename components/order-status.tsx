'use client';
import { useEffect, useState } from 'react';

export function OrderStatus({ id, status, editable = true }: { id: string; status: string; editable?: boolean }) {
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setValue(status); }, [status]);

  async function update(next: string) {
    setError('');
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save order status. Please try again.');
      if (!result.ok || result.status !== next) throw new Error('Order status was not confirmed. Please try again.');
      setValue(result.status);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save order status. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return <div>
    <select aria-label="Fulfilment status" aria-busy={saving} disabled={saving || !editable || value === 'cancelled'} value={value}
      onChange={(event) => { void update(event.target.value); }} className="rounded-lg border border-black/15 bg-white p-2 text-xs">
      {!['paid', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].includes(value) && <option disabled value={value}>{value.replaceAll('_', ' ')}</option>}
      {['paid', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((item) => <option disabled={item === 'paid'} value={item} key={item}>{item.replaceAll('_', ' ')}</option>)}
    </select>
    {saving && <p role="status" className="mt-2 text-xs text-black/60">Saving…</p>}
    {error && <p role="alert" className="mt-2 max-w-48 text-xs text-red-700">{error}</p>}
  </div>;
}
