import 'server-only';
import { deliveryOptions } from '@/data/catalog';

export type PaidOrderNotification = {
  order_number: string;
  customer_name: string;
  phone: string;
  room_number: string | null;
  delivery_address: string;
  delivery_type: string;
  items: { name: string; quantity: number; cableType?: string }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  hotel_ref: string | null;
  hotel_commission: number;
  special_instructions: string | null;
};

function formatMessage(order: PaidOrderNotification, hotelName?: string | null) {
  const euro = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const cableNames: Record<string, string> = { 'usb-c-cable': 'USB-C', 'lightning-cable': 'Lightning' };
  const items = order.items.map(item => {
    const cable = item.cableType ? ` (${cableNames[item.cableType] ?? item.cableType})` : '';
    return `- ${item.name} × ${item.quantity}${cable}`;
  }).join('\n');
  const text = [
    '🟢 NEW PAID ORDER', '',
    `Order: ${order.order_number}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Room: ${order.room_number?.trim() || '—'}`, '',
    'Hotel/Destination:', hotelName?.trim() || order.delivery_address, '',
    'Delivery:', deliveryOptions.find(option => option.id === order.delivery_type)?.name ?? order.delivery_type, '',
    'Items:', items, '',
    `Subtotal: ${euro(order.subtotal)}`,
    `Delivery: ${euro(order.delivery_fee)}`,
    `Total: ${euro(order.total)}`, '',
    'Referral:', order.hotel_ref?.trim() || 'Direct', '',
    'Hotel commission:', euro(order.hotel_commission), '',
    'Special instructions:', order.special_instructions?.trim() || '—',
  ].join('\n');
  // Keep unusually long legacy orders within Telegram's single-message limit.
  const suffix = '\n[Truncated — see admin for full order.]';
  return text.length <= 4096 ? text : text.slice(0, 4096 - suffix.length) + suffix;
}

// Best-effort, one attempt only. The webhook calls this only when its conditional
// pending -> paid update wins. Failures must never trigger a payment retry.
export async function notifyPaidOrder(order: PaidOrderNotification, hotelName?: string | null): Promise<void> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    if (!token || !chatId) {
      console.warn('[telegram] not_configured');
      return;
    }
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: formatMessage(order, hotelName), link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
      redirect: 'error',
    });
    if (!response.ok) {
      console.error(`[telegram] http_error status=${response.status}`);
      return;
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true) {
      console.error('[telegram] api_error');
    }
  } catch {
    // Fetch errors can contain the request URL (and bot token). Never log them,
    // the response body, or customer details.
    console.error('[telegram] notification_failed');
  }
}
