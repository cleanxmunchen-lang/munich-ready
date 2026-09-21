type HotelOperation = 'hotels.select' | 'hotels.insert' | 'hotels.update';

function redact(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  let text = String(value);
  // Provider errors may include URLs, headers or supplied values. Keep useful
  // database diagnostics, but remove configured credentials before logging.
  const secrets = Object.entries(process.env)
    .filter(([name, secret]) => /SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE_KEY|ANON_KEY/i.test(name) && secret?.trim())
    .map(([, secret]) => secret!.trim()).sort((a, b) => b.length - a.length);
  for (const secret of secrets) text = text.split(secret).join('[REDACTED]');
  return text
    .replace(/\b(?:Bearer|Basic)\s+[^\s,;"']+/gi, '[REDACTED authorization]')
    .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED JWT]')
    .replace(/\b(?:sb_secret_|sk_live_|sk_test_|whsec_)[A-Za-z0-9_-]+\b/g, '[REDACTED key]')
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1[REDACTED]@')
    .slice(0, 4000);
}

export function logHotelDatabaseError(operation: HotelOperation, error: unknown) {
  const fields = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  console.error('[admin-hotels] supabase_error ' + JSON.stringify({
    operation,
    table: 'public.hotels',
    code: redact(fields.code),
    message: redact(fields.message) ?? redact(error) ?? 'Unknown database error',
    details: redact(fields.details),
    hint: redact(fields.hint),
    configuration: {
      supabaseUrlPresent: Boolean(process.env.SUPABASE_URL?.trim()),
      serviceRoleKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    },
  }));
}
