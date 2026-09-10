import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuthStatus } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

const schema = z.object({ status: z.enum(['preparing', 'out_for_delivery', 'delivered', 'cancelled']) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminAuthStatus();
  if (auth === 'unconfigured') return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  if (auth !== 'authenticated') return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Order storage is not configured.' }, { status: 503 });

  const input = schema.safeParse(await request.json().catch(() => null));
  const id = z.string().uuid().safeParse((await params).id);
  if (!input.success || !id.success) return NextResponse.json({ error: 'Invalid order or status.' }, { status: 400 });

  try {
    const { data, error } = await supabaseAdmin.from('orders')
      .update({ status: input.data.status }).eq('id', id.data).eq('payment_status', 'paid')
      .select('id,status').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Order not found or payment has not been confirmed.' }, { status: 409 });
    return NextResponse.json({ ok: true, status: data.status });
  } catch {
    return NextResponse.json({ error: 'Unable to save order status. Please try again.' }, { status: 500 });
  }
}
