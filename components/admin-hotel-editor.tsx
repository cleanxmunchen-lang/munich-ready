'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Hotel } from '@/lib/hotels';
import { getHotelReferralUrl } from '@/lib/hotel-referral';

export function AdminHotelEditor({ hotel }: { hotel?: Hotel }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refCode, setRefCode] = useState(hotel?.ref_code ?? '');
  const submitting = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true); setError(''); setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(hotel ? `/api/admin/hotels/${hotel.id}` : '/api/admin/hotels', {
        method: hotel ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.get('name'), address: form.get('address'), ref_code: refCode,
          commission_percent: Number(form.get('commission_percent')), active: form.get('active') === 'on' }),
      });
      const result = await response.json();
      if (!response.ok || !result.hotel) throw new Error(result.error || 'Unable to save hotel. Please try again.');
      setOpen(false); setNotice(hotel ? 'Hotel updated.' : 'Hotel created.');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save hotel. Please try again.');
    } finally { submitting.current = false; setSaving(false); }
  }

  return <div className="admin-hotel-editor mt-5">
    {!open && <button type="button" className={hotel ? 'admin-hotel-action' : 'button-primary'} onClick={() => {
      setRefCode(hotel?.ref_code ?? ''); setError(''); setNotice(''); setOpen(true);
    }}>{hotel ? 'Edit hotel' : 'Add hotel'}</button>}
    {notice && <p role="status" className="mt-2 text-sm">{notice}</p>}
    {open && <form onSubmit={save} className="card mt-3 p-5" aria-label={hotel ? `Edit ${hotel.name}` : 'Create hotel'}>
      <h2 className="text-lg font-bold">{hotel ? 'Edit hotel' : 'New hotel'}</h2>
      <fieldset disabled={saving} className="mt-4 grid min-w-0 gap-4 disabled:opacity-60">
        <label className="text-sm font-semibold">Hotel name
          <input required name="name" minLength={2} maxLength={200} defaultValue={hotel?.name ?? ''} className="mt-1 w-full rounded-xl border p-3" />
        </label>
        <label className="text-sm font-semibold">Address
          <input name="address" maxLength={500} defaultValue={hotel?.address ?? ''} className="mt-1 w-full rounded-xl border p-3" />
        </label>
        <label className="text-sm font-semibold">Referral code
          <input required name="ref_code" pattern="[a-zA-Z0-9_\-]{1,64}" maxLength={64} value={refCode} onChange={event => setRefCode(event.target.value.toLowerCase())}
            autoCapitalize="none" spellCheck={false} className="mt-1 w-full rounded-xl border p-3" aria-describedby={`ref-help-${hotel?.id ?? 'new'}`} />
        </label>
        <p id={`ref-help-${hotel?.id ?? 'new'}`} className="break-all text-xs text-black/60">
          {refCode ? getHotelReferralUrl(refCode.trim().toLowerCase()) : 'Use letters, numbers, hyphens or underscores.'}
        </p>
        {hotel && <p className="text-xs text-amber-800">Changing the referral code invalidates previous links and printed QR codes. Existing orders stay linked to this hotel. Commission changes do not recalculate already-paid orders.</p>}
        <label className="text-sm font-semibold">Commission (%)
          <input required type="number" name="commission_percent" min={0} max={100} step="0.01" defaultValue={hotel?.commission_percent ?? 15} className="mt-1 w-full rounded-xl border p-3" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={hotel?.active ?? true} className="h-4 w-4" /> Active
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="button-primary disabled:opacity-50">{saving ? 'Saving…' : hotel ? 'Save changes' : 'Create hotel'}</button>
          <button type="button" className="admin-hotel-action" onClick={() => { setOpen(false); setError(''); }}>Cancel</button>
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </form>}
  </div>;
}
