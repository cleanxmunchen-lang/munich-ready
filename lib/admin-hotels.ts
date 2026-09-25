import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuthStatus } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { logHotelDatabaseError } from '@/lib/admin-hotel-errors';

const hotelInput = z.object({
  name: z.string().trim().min(2, 'Enter a hotel name.').max(200),
  address: z.string().trim().max(500).default(''),
  ref_code: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{1,64}$/, 'Use 1–64 letters, numbers, hyphens or underscores for the referral code.'),
  commission_percent: z.number().finite().min(0).max(100).multipleOf(0.01).default(15),
  active: z.boolean().default(true),
}).strict();

export async function listAdminHotels() {
  const auth = await getAdminAuthStatus();
  if (auth === 'unconfigured') return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  if (auth !== 'authenticated') return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  if (!supabaseAdmin) {
    logHotelDatabaseError('hotels.select', { code: 'CONFIG_MISSING', message: 'Hotel storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    return NextResponse.json({ error: 'Hotel storage is not configured.' }, { status: 503 });
  }
  try {
    // List real hotel columns only. QR assets and reporting totals are derived,
    // not database columns or dependencies of the hotel-list API.
    const { data, error } = await supabaseAdmin.from('hotels')
      .select('id,name,ref_code,address,commission_percent,active,created_at');
    if (error) throw error;
    return NextResponse.json({ hotels: data ?? [] });
  } catch (error) {
    logHotelDatabaseError('hotels.select', error);
    return NextResponse.json({ error: 'Unable to load hotels. Please refresh and try again.' }, { status: 500 });
  }
}

export async function saveAdminHotel(request: Request, id?: string) {
  const auth = await getAdminAuthStatus();
  if (auth === 'unconfigured') return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  if (auth !== 'authenticated') return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const operation = id === undefined ? 'hotels.insert' : 'hotels.update';
  if (!supabaseAdmin) {
    logHotelDatabaseError(operation, { code: 'CONFIG_MISSING', message: 'Hotel storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    return NextResponse.json({ error: 'Hotel storage is not configured.' }, { status: 503 });
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return NextResponse.json({ error: 'Send hotel details as JSON.' }, { status: 415 });
  }
  if (id !== undefined && !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid hotel.' }, { status: 400 });
  }
  const input = hotelInput.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message || 'Please check the hotel details.' }, { status: 400 });

  try {
    const fields = {
      name: input.data.name,
      address: input.data.address || null,
      ref_code: input.data.ref_code,
      commission_percent: input.data.commission_percent,
      active: input.data.active,
    };
    const query = id === undefined
      ? supabaseAdmin.from('hotels').insert(fields)
      : supabaseAdmin.from('hotels').update(fields).eq('id', id);
    const { data, error } = await query.select('id,name,address,ref_code,commission_percent,active').maybeSingle();
    if (error) {
      logHotelDatabaseError(operation, error);
      return NextResponse.json({ error: error.code === '23505'
        ? 'That referral code is already in use. Choose a different code.'
        : 'Unable to save hotel. Please try again.' }, { status: error.code === '23505' ? 409 : 500 });
    }
    if (!data) {
      logHotelDatabaseError(operation, { code: 'NO_ROW_RETURNED', message: 'Supabase returned no hotel row for the write operation.' });
      return NextResponse.json({ error: id ? 'Hotel not found. Refresh and try again.' : 'Unable to create hotel.' }, { status: id ? 404 : 500 });
    }
    return NextResponse.json({ hotel: data }, { status: id ? 200 : 201 });
  } catch (error) {
    logHotelDatabaseError(operation, error);
    return NextResponse.json({ error: 'Unable to save hotel. Please try again.' }, { status: 500 });
  }
}
