'use client';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/cart-provider';

export function ReferralCapture({ ref }: { ref?: string }) {
	const { refCode, setRefCode } = useCart();
	const [hotel, setHotel] = useState<{ name: string } | null>(null);
	useEffect(() => { if (ref) setRefCode(ref); }, [ref, setRefCode]);
	useEffect(() => { if (!refCode) return; fetch(`/api/hotels/${encodeURIComponent(refCode)}`).then((response) => response.ok ? response.json() : null).then(setHotel).catch(() => setHotel(null)); }, [refCode]);
	if (!hotel) return null;
	return (
		<div className="shell mt-4">
			<div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f1f6f2]">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
							<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" stroke="#184f3a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
							<circle cx="12" cy="9" r="2" fill="#184f3a" />
						</svg>
					</div>
					<div>
							<div className="text-sm font-semibold">Ordering for <span className="font-bold">{hotel.name}</span></div>
						<div className="text-xs text-black/60">Order online. We deliver to reception or your agreed handover point.</div>
					</div>
				</div>
			</div>
		</div>
	);
}
