import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { CartDrawer } from '@/components/cart-drawer';
import { AddToCartToast } from '@/components/add-to-cart-toast';
import { I18nProvider } from '@/components/i18n-provider';
export const metadata: Metadata = { title: 'Munich Ready | Travel & Festival Essentials Delivered to Your Hotel', description: 'Travel and festival essentials delivered directly to hotels in Munich. Choose a ready-made kit or build your own.', openGraph: { title: 'Munich Ready', description: 'Festival-day essentials delivered to your Munich hotel.', type: 'website' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
			<html lang="en">
				<body>
					<I18nProvider>
						<CartProvider>
							{children}
							<CartDrawer />
							<AddToCartToast />
						</CartProvider>
					</I18nProvider>
				</body>
			</html>
	);
}
