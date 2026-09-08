'use client';
import { useState } from 'react';
import Image from 'next/image';
import { ProductArt } from './product-art';

export function ProductImage({ src, name, className = '', sizes = '(max-width: 640px) 100vw, 320px', priority = false }: { src?: string; name: string; className?: string; sizes?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <ProductArt name={name} className={className} />;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white ${className}`}>
      <Image src={src} alt={name} fill sizes={sizes} priority={priority} onError={() => setFailed(true)} style={{ objectFit: 'contain' }} />
    </div>
  );
}
