'use client';
import { useState } from 'react';

export function AdminHotelReferralActions({ url, refCode, png, svg }: { url: string; refCode: string; png: string; svg: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage('Referral link copied.'); }
    catch { setMessage('Unable to copy automatically. Select and copy the referral link above.'); }
  }
  return <div className="mt-4">
    <div className="flex flex-wrap gap-2">
      <a href={png} download={`munich-ready-${refCode}.png`} className="admin-hotel-action">Download QR as PNG</a>
      <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} download={`munich-ready-${refCode}.svg`} className="admin-hotel-action">Download QR as SVG</a>
      <button type="button" onClick={copy} className="admin-hotel-action">Copy referral link</button>
    </div>
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </div>;
}
