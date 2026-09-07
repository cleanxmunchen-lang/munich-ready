export function calculateHotelCommission(subtotal: number, commissionPercent: number | null | undefined) { return Math.round(subtotal * ((commissionPercent ?? 0) / 100)); }
