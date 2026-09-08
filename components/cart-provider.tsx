'use client';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { deliveryOptions, kits, products, type KitId, type ProductId } from '@/data/catalog';
import type { CheckoutItem } from '@/lib/order';

type CartContextType = {
	items: CheckoutItem[];
	deliveryType: string;
	refCode: string | null;
	setRefCode: (ref: string | null) => void;
	addKit: (id: KitId, cableType?: 'usb-c-cable' | 'lightning-cable') => void;
	addProduct: (id: ProductId) => void;
	setCustom: (ids: ProductId[]) => void;
	remove: (index: number) => void;
	setDeliveryType: (id: string) => void;
	subtotal: number;
	deliveryFee: number;
	total: number;
	cartOpen: boolean;
	setCartOpen: (open: boolean) => void;
	showToast: (message: string) => void;
	toast: string | null;
	setQuantity: (index: number, quantity: number) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
	const [items, setItems] = useState<CheckoutItem[]>([]);
	const [deliveryType, setDeliveryType] = useState('hotel');
	const [refCode, setRefCode] = useState<string | null>(null);
	const [ready, setReady] = useState(false);
	const [cartOpen, setCartOpen] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => () => {
		if (toastTimer.current !== null) clearTimeout(toastTimer.current);
	}, []);

	const showToast = (message: string) => {
		if (toastTimer.current !== null) clearTimeout(toastTimer.current);
		setToast(message);
		toastTimer.current = setTimeout(() => setToast(null), 2200);
	};

	const setQuantity = (index: number, quantity: number) => {
		setItems((previous) => {
			if (quantity <= 0) return previous.filter((_, i) => i !== index);
			return previous.map((it, i) => i === index ? { ...it, quantity } : it);
		});
	};

	useEffect(() => {
		const stored = sessionStorage.getItem('munich-ready-cart');
		if (stored) {
			try {
				const state = JSON.parse(stored);
				setItems(state.items ?? []);
				setDeliveryType(state.deliveryType ?? 'hotel');
				setRefCode(state.refCode ?? null);
			} catch {}
		}
		setReady(true);
	}, []);

	useEffect(() => {
		if (ready) sessionStorage.setItem('munich-ready-cart', JSON.stringify({ items, deliveryType, refCode }));
	}, [ready, items, deliveryType, refCode]);

	const value = useMemo(() => {
		const subtotal = items.reduce((sum, item) => sum + (item.kind === 'kit' ? kits[item.id].price : products[item.id].price) * item.quantity, 0);
		const deliveryFee = deliveryOptions.find((option) => option.id === deliveryType)?.price ?? 0;
		return {
			items,
			deliveryType,
			refCode,
			setRefCode,
			addKit: (id: KitId, cableType?: 'usb-c-cable' | 'lightning-cable') => setItems((previous) => [...previous.filter((item) => item.kind !== 'kit'), { kind: 'kit', id, cableType, quantity: 1 }]),
			setCustom: (ids: ProductId[]) => setItems((previous) => [...previous.filter((item) => item.kind === 'kit'), ...ids.map((id) => ({ kind: 'product' as const, id, quantity: 1 }))]),
			addProduct: (id: ProductId) => setItems((previous) => {
				const found = previous.findIndex((it) => it.kind === 'product' && it.id === id);
				if (found >= 0) return previous.map((it, i) => i === found ? { ...it, quantity: it.quantity + 1 } : it);
				return [...previous, { kind: 'product' as const, id, quantity: 1 }];
			}),
			remove: (index: number) => setItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index)),
			setDeliveryType,
			subtotal,
			deliveryFee,
			total: subtotal + deliveryFee,
			cartOpen,
			setCartOpen,
			showToast,
			toast,
			setQuantity,
		};
	}, [items, deliveryType, refCode, cartOpen, toast]);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
	const value = useContext(CartContext);
	if (!value) throw new Error('CartProvider missing');
	return value;
}
