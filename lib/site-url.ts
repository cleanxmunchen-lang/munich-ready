export function getSiteUrl() {
  const configuredUrl = process.env.SITE_URL?.trim();
  const fallback = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://munichready.store';
  return (configuredUrl || fallback).replace(/\/+$/, '');
}
