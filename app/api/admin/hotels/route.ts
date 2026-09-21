import { saveAdminHotel } from '@/lib/admin-hotels';

export async function POST(request: Request) {
  return saveAdminHotel(request);
}
