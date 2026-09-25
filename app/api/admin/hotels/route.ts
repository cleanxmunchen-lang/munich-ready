import { listAdminHotels, saveAdminHotel } from '@/lib/admin-hotels';
import { ADMIN_HOTELS_REVISION } from '@/lib/admin-hotel-errors';

export const dynamic = 'force-dynamic';

function identifyResponse(response: Response) {
  response.headers.set('X-MunichReady-Hotels-Version', ADMIN_HOTELS_REVISION);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function GET() {
  return identifyResponse(await listAdminHotels());
}

export async function POST(request: Request) {
  return identifyResponse(await saveAdminHotel(request));
}
