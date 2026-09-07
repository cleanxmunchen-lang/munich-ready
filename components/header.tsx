'use client';
import Link from 'next/link'; import { useCart } from '@/components/cart-provider'; import { formatPrice } from '@/data/catalog';
export function Header() { const { items, total } = useCart(); return <header className="shell flex h-20 items-center justify-between"><Link href="/" className="text-lg font-black tracking-tight">MUNICH <span className="text-[#184f3a]">READY</span></Link><Link href="/checkout" className="button-secondary min-h-10 px-4">Cart {items.length ? `(${items.length}) · ${formatPrice(total)}` : ''}</Link></header>; }
