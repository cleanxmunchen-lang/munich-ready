import QRCode from 'qrcode';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { logHotelDatabaseError } from '@/lib/admin-hotel-errors';
import { formatPrice } from '@/data/catalog';
import type { Hotel } from '@/lib/hotels';
import { getHotelReferralUrl } from '@/lib/hotel-referral';
import { AdminHotelEditor } from '@/components/admin-hotel-editor';
import { AdminHotelReferralActions } from '@/components/admin-hotel-referral-actions';

type HotelReport = Hotel & { orders: { subtotal: number; payment_status: string; hotel_commission: number | null }[] };

export default async function Hotels() {
  await requireAdmin();
  let hotels: HotelReport[] = [];
  let loadError = '';
  if (!supabaseAdmin) {
    logHotelDatabaseError('hotels.select', { code: 'CONFIG_MISSING', message: 'Hotel storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    loadError = 'Supabase client is not configured.';
  } else {
    try {
      const { data, error } = await supabaseAdmin.from('hotels')
        .select('id,name,address,ref_code,commission_percent,active,orders(subtotal,payment_status,hotel_commission)')
        .returns<HotelReport[]>();
      if (error) throw error;
      hotels = data ?? [];
    } catch (error) {
      logHotelDatabaseError('hotels.select', error);
      loadError = 'Unable to load hotels. Please refresh and try again.';
    }
  }

  return <>
    <p className="eyebrow">Partners</p>
    <h1 className="admin-hotels-title mt-2 text-3xl font-bold">Hotels</h1>
    {supabaseAdmin && <AdminHotelEditor />}
    {loadError ? <p role="alert" className="mt-6 text-red-700">{loadError}</p> : <>
      {!hotels.length && <p className="mt-6 text-black/60">No hotel partners yet. Add your first hotel above.</p>}
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {await Promise.all(hotels.map(async hotel => {
          const paid = (hotel.orders ?? []).filter(order => order.payment_status === 'paid');
          const sales = paid.reduce((sum, order) => sum + order.subtotal, 0);
          const commission = paid.reduce((sum, order) => sum + (order.hotel_commission ?? 0), 0);
          const url = getHotelReferralUrl(hotel.ref_code);
          const options = { margin: 4, errorCorrectionLevel: 'M' as const, color: { dark: '#000000', light: '#ffffff' } };
          const [png, svg] = await Promise.all([
            QRCode.toDataURL(url, { ...options, width: 1024 }),
            QRCode.toString(url, { ...options, type: 'svg' }),
          ]);
          // Pass only editable hotel fields to the client, not order reporting data.
          const editableHotel: Hotel = { id: hotel.id, name: hotel.name, address: hotel.address, ref_code: hotel.ref_code, commission_percent: hotel.commission_percent, active: hotel.active };
          return <article className="admin-hotel-card card min-w-0 p-6" key={hotel.id}>
            <div className="flex flex-col gap-5 sm:flex-row">
              {/* The QR is generated locally as a data URL, not a remote product image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-[120px] w-[120px] shrink-0" src={png} width="120" height="120" alt={`QR code for ${hotel.name}`} />
              <div className="min-w-0">
                <h2 className="font-bold">{hotel.name}</h2>
                <p className="mt-1 text-sm text-black/60">{hotel.address || 'No address set'}</p>
                <p className="mt-1 text-sm text-black/60">Ref: {hotel.ref_code} · {hotel.active ? 'Active' : 'Inactive'}</p>
                <p className="mt-3 text-sm">Commission: {hotel.commission_percent}%<br />Paid orders: {paid.length}<br />Attributed sales: {formatPrice(sales)}<br />Estimated owed: {formatPrice(commission)}</p>
              </div>
            </div>
            <a className="admin-referral-link mt-4 block break-all text-sm underline underline-offset-4" href={url}>{url}</a>
            <AdminHotelReferralActions url={url} refCode={hotel.ref_code} png={png} svg={svg} />
            <AdminHotelEditor hotel={editableHotel} />
          </article>;
        }))}
      </div>
    </>}
  </>;
}
