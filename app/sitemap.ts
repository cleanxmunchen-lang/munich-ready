import { getSiteUrl } from '@/lib/site-url';
import type { MetadataRoute } from 'next'; export default function sitemap(): MetadataRoute.Sitemap { const base = getSiteUrl(); return ['', '/impressum', '/datenschutz', '/widerruf', '/versand', '/agb', '/contact'].map((path) => ({ url: `${base}${path}`, lastModified: new Date() })); }
