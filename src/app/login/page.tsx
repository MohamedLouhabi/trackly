'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AuthShell,
  ArrowIcon,
  buttonClass,
  fieldLabelClass,
  underlineInputClass,
} from '@/components/AuthShell';

function SignInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M8 4.5V4a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 17 4v12a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 8 16v-.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.5 10h9M8.5 6.5 12 10l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirectTo') ?? '/dashboard';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Invalid email or password.');
      return;
    }
    // Only allow internal redirect targets.
    router.push(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
    router.refresh();
  }

  return (
    <AuthShell title="Welcome!" subtitle="Sign in to your account" icon={<SignInIcon />}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className={fieldLabelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={underlineInputClass} />
        </div>
        <div>
          <label htmlFor="password" className={fieldLabelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className={underlineInputClass}
          />
        </div>

        <div className="flex items-center justify-end text-[13px]">
          <Link href="/forgot-password" className="text-accent-600 no-underline hover:underline">
            forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-accent2-600">{error}</p>}

        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? 'Logging in…' : 'Login'} <ArrowIcon />
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-neutral-600">
        No account yet?{' '}
        <Link href="/signup" className="font-semibold text-accent-600 no-underline hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  // useSearchParams() requires a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={<AuthShell title="Welcome!">…</AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
