'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AuthShell,
  ArrowIcon,
  buttonClass,
  fieldLabelClass,
  underlineInputClass,
} from '@/components/AuthShell';

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 17c.8-3 3.4-4.5 6.5-4.5s5.7 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: form.get('displayName'),
        email: form.get('email'),
        password: form.get('password'),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }
    setMessage(data.message ?? 'Check your email to confirm your account.');
  }

  return (
    <AuthShell title="Create account!" icon={<PersonIcon />}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="displayName" className={fieldLabelClass}>
            Name
          </label>
          <input id="displayName" name="displayName" required maxLength={80} className={underlineInputClass} />
        </div>
        <div>
          <label htmlFor="email" className={fieldLabelClass}>
            E-mail
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
            minLength={10}
            placeholder="min 10 chars, letters + numbers"
            className={underlineInputClass}
          />
        </div>

        {error && <p className="text-sm text-accent2-600">{error}</p>}
        {message && <p className="text-sm text-accent-700">{message}</p>}

        <div className="pt-1 text-center">
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? 'Creating…' : 'Create'} <ArrowIcon />
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-[13px] text-neutral-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-accent-600 no-underline hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
