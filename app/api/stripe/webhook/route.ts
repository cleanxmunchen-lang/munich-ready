import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateHotelCommission } from '@/lib/commission';

class WebhookError extends Error {
  constructor(public code: string, public status = 500) { super(code); }
}

export async function POST(request: Request) {
  if (!stripe || !supabaseAdmin || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse('Webhook unavailable', { status: 500 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), request.headers.get('stripe-signature') ?? '', process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new NextResponse('Invalid signature', { status: 400 });
  }
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.expired') {
    return NextResponse.json({ received: true });
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) throw new WebhookError('missing_order_reference', 400);
    const db = supabaseAdmin;
    async function readOrder() {
      const { data, error } = await db.from('orders')
        .select('total,currency,subtotal,hotel_id,payment_status,stripe_session_id,stripe_payment_intent_id')
        .eq('id', orderId).maybeSingle();
      if (error || !data) throw new WebhookError('order_read_failed');
      if (data.stripe_session_id !== session.id) throw new WebhookError('session_mismatch', 409);
      return data;
    }
    const order = await readOrder();
    if (event.type === 'checkout.session.completed') {
      if (session.payment_status !== 'paid' || session.currency !== 'eur' || order.currency !== 'eur' ||
          !Number.isSafeInteger(order.total) || session.amount_total !== order.total) {
        throw new WebhookError('payment_verification_failed', 422);
      }
      const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      if (!paymentIntent) throw new WebhookError('missing_payment_intent', 422);
      if (order.payment_status === 'paid' && order.stripe_payment_intent_id === paymentIntent) {
        return NextResponse.json({ received: true });
      }
      if (order.payment_status !== 'pending') throw new WebhookError('payment_state_conflict', 409);
      let commission = 0;
      if (order.hotel_id) {
        const { data: hotel, error } = await db.from('hotels').select('commission_percent').eq('id', order.hotel_id).maybeSingle();
        if (error || !hotel) throw new WebhookError('hotel_read_failed');
        commission = calculateHotelCommission(order.subtotal, hotel.commission_percent);
        if (!Number.isSafeInteger(commission) || commission < 0) throw new WebhookError('invalid_commission');
      }
      const { data, error } = await db.from('orders').update({
        payment_status: 'paid', status: 'paid', stripe_payment_intent_id: paymentIntent, hotel_commission: commission,
      }).eq('id', orderId).eq('stripe_session_id', session.id).eq('payment_status', 'pending').select('id').maybeSingle();
      if (error) throw new WebhookError('payment_update_failed');
      // A concurrent delivery may have won the conditional update. Confirm its result.
      if (!data) {
        const current = await readOrder();
        if (current.payment_status !== 'paid' || current.stripe_payment_intent_id !== paymentIntent) {
          throw new WebhookError('payment_update_conflict', 409);
        }
      }
    } else if (order.payment_status === 'pending') {
      const { data, error } = await db.from('orders').update({ payment_status: 'expired' })
        .eq('id', orderId).eq('stripe_session_id', session.id).eq('payment_status', 'pending').select('id').maybeSingle();
      if (error) throw new WebhookError('expiration_update_failed');
      if (!data) {
        const current = await readOrder();
        if (!['expired', 'paid'].includes(current.payment_status)) throw new WebhookError('expiration_update_conflict', 409);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // Only fixed diagnostic codes; never log raw provider errors or request data.
    console.error('[stripe-webhook]', error instanceof WebhookError ? error.code : 'processing_failed');
    return new NextResponse('Webhook processing failed', { status: error instanceof WebhookError ? error.status : 500 });
  }
}
