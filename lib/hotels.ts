import { supabaseAdmin } from '@/lib/supabase';
export type Hotel = { id: string; name: string; ref_code: string; address: string | null; commission_percent: number; active: boolean };
export function normalizeRef(ref: string | null | undefined) { return (ref ?? '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '').slice(0, 64); }
export async function getHotelByRef(ref: string | null | undefined): Promise<Hotel | null> { const code = normalizeRef(ref); if (!code || !supabaseAdmin) return null; const { data } = await supabaseAdmin.from('hotels').select('id,name,ref_code,address,commission_percent,active').eq('ref_code', code).eq('active', true).maybeSingle(); return data as Hotel | null; }
