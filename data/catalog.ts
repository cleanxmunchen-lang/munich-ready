export type ProductId = 'bag' | 'power-bank' | 'usb-c-cable' | 'lightning-cable' | 'poncho' | 'plasters' | 'wipes' | 'tissues';
export type KitId = 'essential-kit' | 'power-kit' | 'full-day-kit';

export const products: Record<ProductId, { id: ProductId; name: string; price: number; image: string; description: string }> = {
  bag: { id: 'bag', name: 'Small Crossbody Bag', price: 1290, image: '/products/bag.png', description: 'Hands-free essentials, kept close.' },
  'power-bank': { id: 'power-bank', name: 'Power Bank', price: 1690, image: '/products/power-bank.png', description: 'A pocket-sized charge for the day.' },
  'usb-c-cable': { id: 'usb-c-cable', name: 'USB-C Cable', price: 590, image: '/products/usb-c-cable.png', description: 'Reliable USB-C charging.' },
  'lightning-cable': { id: 'lightning-cable', name: 'Lightning Cable', price: 690, image: '/products/lightning-cable.png', description: 'Reliable Lightning charging.' },
  poncho: { id: 'poncho', name: 'Rain Poncho', price: 390, image: '/products/rain-poncho.png', description: 'Lightweight cover when weather turns.' },
  plasters: { id: 'plasters', name: 'Blister Plasters', price: 390, image: '/products/blister-plasters.png', description: 'A little comfort goes a long way.' },
  wipes: { id: 'wipes', name: 'Wet Wipes', price: 290, image: '/products/wet-wipes.png', description: 'A quick freshen-up.' },
  tissues: { id: 'tissues', name: 'Pocket Tissues', price: 190, image: '/products/pocket-tissues.png', description: 'Useful, compact, ready.' }
};

export const kits: Record<KitId, { id: KitId; name: string; price: number; productIds: ProductId[]; popular?: boolean; cableChoice?: boolean; description: string }> = {
  'essential-kit': { id: 'essential-kit', name: 'Essential Kit', price: 2490, productIds: ['bag', 'poncho', 'plasters', 'wipes', 'tissues'], cableChoice: true, description: 'The basics for a comfortable festival day.' },
  'power-kit': { id: 'power-kit', name: 'Power Kit', price: 3490, productIds: ['bag', 'power-bank', 'usb-c-cable', 'poncho', 'plasters'], popular: true, cableChoice: true, description: 'Stay charged and prepared all day.' },
  'full-day-kit': { id: 'full-day-kit', name: 'Full Day Kit', price: 4490, productIds: ['bag', 'power-bank', 'usb-c-cable', 'poncho', 'plasters', 'wipes', 'tissues'], cableChoice: true, description: 'Everything you need from morning to evening.' }
};

export const deliveryOptions = [
  { id: 'hotel', name: 'Hotel Delivery', price: 490, description: 'Delivered to your hotel reception or agreed location.' },
  { id: 'priority', name: 'Same-Day Priority', price: 990, description: 'Priority preparation when available.' },
  { id: 'express', name: 'Express Delivery', price: 1490, description: 'Estimated 60–90 minutes depending on location and demand.' }
] as const;

export const formatPrice = (cents: number) => new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
