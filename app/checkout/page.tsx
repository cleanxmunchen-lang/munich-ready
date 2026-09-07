import { Header } from '@/components/header'; import { CheckoutForm } from '@/components/checkout-form'; import { Footer } from '@/components/footer';
export default function CheckoutPage() { return <><Header/><main className="shell py-10 sm:py-16"><p className="eyebrow">Checkout</p><h1 className="mt-2 text-4xl font-bold">Almost ready.</h1><CheckoutForm/></main><Footer/></>; }
