import { saveAdminHotel } from '@/lib/admin-hotels';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return saveAdminHotel(request, (await params).id);
}
