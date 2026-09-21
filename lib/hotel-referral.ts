// Printed partner materials must always point to the live store, even when the
// admin is opened on localhost or a Vercel preview with a different SITE_URL.
export function getHotelReferralUrl(refCode: string) {
  const url = new URL('https://munichready.store/');
  url.searchParams.set('ref', refCode);
  return url.toString();
}
