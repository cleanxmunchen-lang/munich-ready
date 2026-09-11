import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSiteUrl } from '@/lib/site-url';
import { calculateOrder, type CheckoutItem } from '@/lib/order';
import { getHotelByRef, normalizeRef } from '@/lib/hotels';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import en from '@/locales/en';
import de from '@/locales/de';
const payloadSchema = z.object({ locale: z.enum(['en', 'de']).default('en'), items: z.array(z.object({ kind: z.enum(['kit','product']), id: z.string(), quantity: z.number().optional(), cableType: z.enum(['usb-c-cable','lightning-cable']).optional() })).min(1).max(10), deliveryType: z.string(), refCode: z.string().nullable().optional(), customerName: z.string().trim().min(2).max(120), roomNumber: z.string().trim().max(30).optional().nullable(), phone: z.string().trim().min(5).max(50), destination: z.string().trim().min(2).max(300), specialInstructions: z.string().trim().max(1000).optional().nullable() });

class CheckoutError extends Error {
  constructor(public code: string, public status = 503, public restart = false) { super(code); }
}

export async function POST(request: Request) {
  try {
    if (!stripe || !supabaseAdmin) throw new CheckoutError('checkout_unavailable');
    const input = payloadSchema.parse(await request.json());
    const orderId = z.string().uuid().parse(request.headers.get('Idempotency-Key') ?? randomUUID());
    let order;
    try { order = calculateOrder(input.items as CheckoutItem[], input.deliveryType); }
    catch { return NextResponse.json({ error: 'Please check your cart and cable selection.' }, { status: 400 }); }
    const hotel = await getHotelByRef(input.refCode);
    const fields = {
      customer_name: input.customerName, room_number: input.roomNumber || null, phone: input.phone,
      hotel_id: hotel?.id ?? null, hotel_ref: hotel?.ref_code ?? normalizeRef(input.refCode),
      delivery_address: hotel?.address || input.destination, delivery_type: order.delivery.id,
      delivery_fee: order.delivery.price, subtotal: order.subtotal, total: order.total, currency: 'eur',
      items: order.items, special_instructions: input.specialInstructions || null,
    };
    const columns = 'id,order_number,stripe_session_id,payment_status,created_at,customer_name,room_number,phone,hotel_id,hotel_ref,delivery_address,delivery_type,delivery_fee,subtotal,total,currency,items,special_instructions';
    const { data: inserted, error: insertError } = await supabaseAdmin.from('orders').insert({
      id: orderId, order_number: `MR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      payment_status: 'pending', status: 'pending_payment', ...fields,
    }).select(columns).single();
    let stored = inserted;
    if (insertError?.code === '23505') {
      // The existing primary key also arbitrates concurrent retries of one attempt.
      const result = await supabaseAdmin.from('orders').select(columns).eq('id', orderId).maybeSingle();
      if (result.error || !result.data) throw new CheckoutError('order_retry_read_failed');
      stored = result.data;
    } else if (insertError || !stored) throw new CheckoutError('order_insert_failed');
    if (!stored) throw new CheckoutError('order_missing');
    const storedFields = Object.fromEntries((Object.keys(fields) as Array<keyof typeof fields>).map(key => [key, stored[key]]));
    if (!isDeepStrictEqual(storedFields, JSON.parse(JSON.stringify(fields)))) {
      throw new CheckoutError('checkout_attempt_changed', 409, true);
    }
    if (stored.payment_status !== 'pending') throw new CheckoutError('checkout_attempt_finished', 409, true);
    // Stripe may prune idempotency keys after 24h. Never recreate an unlinked session after that window.
    if (!stored.stripe_session_id && Date.now() - Date.parse(stored.created_at) >= 23 * 60 * 60 * 1000) {
      throw new CheckoutError('checkout_attempt_expired', 409, true);
    }
    const messages = input.locale === 'de' ? de : en;
    const deliveryNames = { hotel: messages.checkout.hotelDelivery, priority: messages.checkout.sameDay, express: messages.checkout.express };
    const siteUrl = getSiteUrl();
    const session = stored.stripe_session_id
      ? await stripe.checkout.sessions.retrieve(stored.stripe_session_id)
      : await stripe.checkout.sessions.create({
        mode: 'payment', locale: input.locale, payment_method_types: ['card'],
        line_items: [...order.items.map(item => ({
          price_data: { currency: 'eur', product_data: { name: item.kind === 'kit' ? messages.kits.names[item.id] : messages.products.names[item.id] }, unit_amount: item.unitAmount }, quantity: item.quantity,
        })), { price_data: { currency: 'eur', product_data: { name: deliveryNames[order.delivery.id] }, unit_amount: order.delivery.price }, quantity: 1 }],
        metadata: { orderId, orderNumber: stored.order_number },
        success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${siteUrl}/checkout`,
        phone_number_collection: { enabled: false },
      }, { idempotencyKey: `checkout:${orderId}` });
    if (session.status !== 'open' || !session.url) throw new CheckoutError('checkout_session_finished', 409, true);
    if (!stored.stripe_session_id) {
      const { data, error } = await supabaseAdmin.from('orders').update({ stripe_session_id: session.id })
        .eq('id', orderId).eq('payment_status', 'pending').is('stripe_session_id', null).select('id').maybeSingle();
      if (error) throw new CheckoutError('session_persistence_failed');
      if (!data) {
        const result = await supabaseAdmin.from('orders').select('stripe_session_id,payment_status').eq('id', orderId).maybeSingle();
        if (result.error || !result.data) throw new CheckoutError('session_persistence_read_failed');
        if (result.data.stripe_session_id !== session.id || result.data.payment_status !== 'pending') {
          throw new CheckoutError('session_persistence_conflict', 409);
        }
      }
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Please check your checkout details.' }, { status: 400 });
    }
    console.error('[checkout]', error instanceof CheckoutError ? error.code : 'checkout_failed');
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.', restart: error instanceof CheckoutError && error.restart },
      { status: error instanceof CheckoutError ? error.status : 503 });
  }
}
