import Link from 'next/link';
import { ProductImage } from '@/components/product-image';
import { formatPrice, kits, type KitId } from '@/data/catalog';

const benefits = [
  { label: 'Hotel delivery', icon: 'M4 21V3h12v18M2 21h20M16 9h4v12M8 7h4M8 11h4M8 15h4M8 21v-3h4v3' },
  { label: 'Secure online payment', icon: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM8 12l3 3 5-6' },
  { label: 'No account required', icon: 'M14 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM2 21v-2a6 6 0 0 1 10-4M15 18l2 2 5-6' }
];

function KitPreview({ id, featured = false }: { id: KitId; featured?: boolean }) {
  const kit = kits[id];
  const badge = id === 'full-day-kit' ? 'BEST VALUE' : kit.popular ? 'MOST POPULAR' : null;

  return (
    <a
      href={`#${kit.id}`}
      aria-label={`View ${kit.name}, ${formatPrice(kit.price)}`}
      className={`hero-preview block min-w-0 rounded-3xl border border-[#17201a]/10 bg-white p-3 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184f3a] focus-visible:ring-offset-4 md:hover:-translate-y-1 md:hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none ${featured ? 'row-span-2 sm:p-4 shadow-md' : 'shadow-sm'}`}
    >
      <ProductImage
        src={`/products/${kit.id}.png`}
        name={kit.name}
        sizes={featured ? '(max-width: 768px) 96px, (max-width: 1023px) 25vw, 300px' : '(max-width: 768px) 96px, 128px'}
        priority={featured}
        className={`aspect-square w-full ${featured ? '' : 'mx-auto max-w-24 sm:max-w-28 lg:max-w-32'}`}
      />
      <div className="mt-3">
        {badge && (
          <span className="mb-2 inline-block rounded-full bg-[#184f3a] px-2 py-1 text-[9px] font-bold leading-3 tracking-wide text-white sm:text-[10px]">
            {badge}
          </span>
        )}
        <p className={`font-semibold ${featured ? 'text-lg sm:text-xl' : 'text-sm'}`}>{kit.name}</p>
        <p className={`mt-1 font-semibold text-[#184f3a] ${featured ? 'text-xl sm:text-2xl' : 'text-base'}`}>{formatPrice(kit.price)}</p>
      </div>
    </a>
  );
}

export function Hero() {
  return (
    <section className="hero shell pb-2 pt-8 sm:pb-4 sm:pt-10 lg:pt-12" aria-labelledby="hero-heading">
      <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
        <div className="min-w-0">
          <p className="eyebrow">MUNICH HOTEL DELIVERY</p>
          <h1 id="hero-heading" className="mt-3 max-w-xl text-4xl font-bold tracking-[-.02em] sm:text-5xl">Everything you need for your festival day.</h1>
          <p className="mt-4 text-lg font-medium">Forgot something? We’ve got you covered.</p>
          <p className="mt-2 max-w-lg text-base leading-7 text-black/65">Travel &amp; festival essentials delivered directly to your hotel in Munich.</p>
          <div className="hero-actions mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link className="button-primary" href="#kits">Shop Ready Kits</Link>
            <Link className="button-secondary" href="#build">Build Your Own Kit</Link>
          </div>
          <div className="hero-benefits mt-5 flex flex-wrap gap-2">
            {benefits.map(({ label, icon }) => (
              <div key={label} className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white px-3 py-2 text-xs text-black/65">
                <svg className="h-4 w-4 shrink-0 text-[#184f3a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={icon} />
                </svg>
                {label}
              </div>
            ))}
          </div>
        </div>
        <div aria-label="Preview ready-made kits" className="hero-showcase mx-auto grid w-full min-w-0 max-w-lg grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-center gap-3 md:max-w-none lg:gap-4">
          <KitPreview id="full-day-kit" featured />
          <KitPreview id="essential-kit" />
          <KitPreview id="power-kit" />
        </div>
      </div>
    </section>
  );
}
