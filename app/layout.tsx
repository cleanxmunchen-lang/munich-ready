import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { CartDrawer } from '@/components/cart-drawer';
import { MiniCart } from '@/components/mini-cart';
import { AddToCartToast } from '@/components/add-to-cart-toast';
export const metadata: Metadata = { title: 'Munich Ready | Travel & Festival Essentials Delivered to Your Hotel', description: 'Travel and festival essentials delivered directly to hotels in Munich. Choose a ready-made kit or build your own.', openGraph: { title: 'Munich Ready', description: 'Festival-day essentials delivered to your Munich hotel.', type: 'website' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body>
				<CartProvider>
					{children}
					<CartDrawer />
					<MiniCart />
					<AddToCartToast />
				</CartProvider>
			</body>
		</html>
	);
}
