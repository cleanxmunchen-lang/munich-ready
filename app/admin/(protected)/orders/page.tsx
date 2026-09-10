import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-auth';
import { formatPrice } from '@/data/catalog';
import { OrderStatus } from '@/components/order-status';

type AdminOrder = {
  id: string; order_number: string; created_at: string;
  customer_name: string; room_number: string | null; phone: string;
  delivery_address: string; delivery_type: string; hotel_ref: string | null;
  special_instructions: string | null; subtotal: number; delivery_fee: number;
  total: number; hotel_commission: number | null; payment_status: string; status: string;
  hotels: { name: string } | null;
  items: { name: string; quantity: number; cableType?: string }[];
};

const deliveryLabels: Record<string, string> = {
  hotel: 'Hotel Delivery', priority: 'Same-Day Priority', express: 'Express Delivery',
};

export default async function Orders() {
  await requireAdmin();
  const { data: orders, error } = supabaseAdmin
    ? await supabaseAdmin.from('orders')
      .select('id,order_number,created_at,customer_name,room_number,phone,delivery_address,delivery_type,hotel_ref,special_instructions,items,subtotal,delivery_fee,total,hotel_commission,payment_status,status,hotels(name)')
      .order('created_at', { ascending: false }).limit(100).returns<AdminOrder[]>()
    : { data: [], error: null };

  return <>
    <p className="eyebrow">Operations</p>
    <h1 className="mt-2 text-3xl font-bold">Orders</h1>
    <p className="mt-2 text-sm text-black/60">Latest 100 orders. Customer data is visible only to signed-in internal staff.</p>
    <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <table className="min-w-[1000px] w-full text-left text-sm">
        <thead className="border-b border-black/10 bg-[#f6f5ef]"><tr>
          {['Order', 'Date', 'Customer', 'Destination', 'Items', 'Amounts', 'Payment', 'Fulfilment'].map((header) => <th className="p-3 font-bold" key={header}>{header}</th>)}
        </tr></thead>
        <tbody>
          {(orders ?? []).map((order) => <tr className="border-b border-black/5 align-top" key={order.id}>
            <td className="p-3 font-bold">{order.order_number}</td>
            <td className="p-3">{new Date(order.created_at).toLocaleString('en-DE')}</td>
            <td className="p-3">{order.customer_name}<br /><span className="text-black/55">Room {order.room_number || '—'} · {order.phone}</span></td>
            <td className="p-3">
              {order.hotels?.name && <p className="font-semibold">{order.hotels.name}</p>}
              <p>{order.delivery_address}</p>
              <p className="mt-2 text-xs text-black/60">Service: {deliveryLabels[order.delivery_type] ?? order.delivery_type}</p>
              <p className="text-xs text-black/60">Ref: {order.hotel_ref || '—'}</p>
              {order.hotel_commission != null && <p className="text-xs text-black/60">Commission: {formatPrice(order.hotel_commission)}</p>}
            </td>
            <td className="max-w-48 p-3 text-xs">
              <ul className="space-y-1">{order.items.map((item, index) => <li key={index}>
                {item.quantity}× {item.name}
                {item.cableType && <span className="block text-black/60">Cable: {item.cableType === 'usb-c-cable' ? 'USB-C' : item.cableType === 'lightning-cable' ? 'Lightning' : item.cableType}</span>}
              </li>)}</ul>
              <p className="mt-3 whitespace-pre-wrap break-words"><strong>Instructions: </strong>{order.special_instructions || '—'}</p>
            </td>
            <td className="p-3 whitespace-nowrap">
              <p className="text-xs text-black/60">Subtotal: {formatPrice(order.subtotal)}</p>
              <p className="text-xs text-black/60">Delivery: {formatPrice(order.delivery_fee)}</p>
              <p className="mt-1 font-bold">Total: {formatPrice(order.total)}</p>
            </td>
            <td className="p-3">{order.payment_status}</td>
            <td className="p-3"><OrderStatus id={order.id} status={order.status} editable={order.payment_status === 'paid'} /></td>
          </tr>)}
          {!orders?.length && <tr><td className="p-5 text-black/60" colSpan={8}>
            {error ? 'Unable to load orders. Please try again.' : !supabaseAdmin ? 'Supabase is not configured.' : 'No orders yet.'}
          </td></tr>}
        </tbody>
      </table>
    </div>
  </>;
}
