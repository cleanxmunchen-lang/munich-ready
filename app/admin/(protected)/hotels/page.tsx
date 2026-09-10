import { requireAdmin } from '@/lib/admin-auth';
import QRCode from 'qrcode'; import { supabaseAdmin } from '@/lib/supabase'; import { formatPrice } from '@/data/catalog';

export default async function Hotels() {
  await requireAdmin();

  console.log({
    supabaseUrlPresent: Boolean(process.env.SUPABASE_URL),
    supabaseServiceKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });

  if (!supabaseAdmin) {
    return (
      <>
        <p className="eyebrow">Partners</p>
        <h1 className="mt-2 text-3xl font-bold">Hotels</h1>
        <p className="mt-6 text-black/60">Supabase client is not configured.</p>
      </>
    );
  }

  let hotels: any[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('id,name,ref_code,commission_percent,active,orders(subtotal,payment_status,hotel_commission)');

    if (error) {
      console.error('Supabase query failed for public.hotels', error);
      return (
        <>
          <p className="eyebrow">Partners</p>
          <h1 className="mt-2 text-3xl font-bold">Hotels</h1>
          <p className="mt-6 text-black/60">Supabase query failed: {error.message}</p>
        </>
      );
    }

    hotels = data ?? [];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Supabase query failed for public.hotels', err);
    return (
      <>
        <p className="eyebrow">Partners</p>
        <h1 className="mt-2 text-3xl font-bold">Hotels</h1>
        <p className="mt-6 text-black/60">Supabase query failed: {err.message}</p>
      </>
    );
  }

  if (!hotels.length) {
    return (
      <>
        <p className="eyebrow">Partners</p>
        <h1 className="mt-2 text-3xl font-bold">Hotels</h1>
        <p className="mt-6 text-black/60">No hotel partners yet.</p>
      </>
    );
  }

  const siteUrl = process.env.SITE_URL ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://munich-ready.vercel.app');
  return <><p className="eyebrow">Partners</p><h1 className="mt-2 text-3xl font-bold">Hotels</h1><div className="mt-6 grid gap-5 md:grid-cols-2">{await Promise.all((hotels ?? []).map(async (hotel: any) => { const paid = (hotel.orders ?? []).filter((order: any) => order.payment_status === 'paid'); const sales = paid.reduce((sum: number, order: any) => sum + order.subtotal, 0); const commission = paid.reduce((sum: number, order: any) => sum + (order.hotel_commission ?? 0), 0); const url = `${siteUrl}/?ref=${hotel.ref_code}`; const qr = await QRCode.toDataURL(url, { width: 180, margin: 1 }); return <article className="card p-5" key={hotel.id}><div className="flex gap-5"><img src={qr} width="120" height="120" alt={`QR code for ${hotel.name}`} /><div><h2 className="font-bold">{hotel.name}</h2><p className="mt-1 text-sm text-black/60">Ref: {hotel.ref_code} · {hotel.active ? 'Active' : 'Inactive'}</p><p className="mt-3 text-sm">Commission: {hotel.commission_percent}%<br/>Paid orders: {paid.length}<br/>Attributed sales: {formatPrice(sales)}<br/>Estimated owed: {formatPrice(commission)}</p></div></div><a className="mt-4 block break-all text-sm text-[#184f3a] underline" href={url}>{url}</a></article>; }))}</div></>; }
