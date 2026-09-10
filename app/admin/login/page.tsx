'use client';
import { FormEvent, useState } from 'react';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.get('password') }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Unable to sign in. Please try again.');
      }
      window.location.assign('/admin/orders');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="shell flex min-h-screen items-center justify-center">
    <form onSubmit={login} className="card w-full max-w-sm p-7">
      <p className="eyebrow">Internal only</p>
      <h1 className="mt-2 text-2xl font-bold">Admin sign in</h1>
      <label className="mt-6 block text-sm font-semibold">Password
        <input required type="password" name="password" autoComplete="current-password" className="mt-2 w-full rounded-xl border border-black/15 p-3" autoFocus />
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      <button disabled={loading} className="button-primary mt-5 w-full disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </main>;
}
