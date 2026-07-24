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

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email') }),
    });
    const data = await res.json();
    setLoading(false);
    // Always generic — we never reveal whether the email exists.
    setMessage(data.message ?? 'If that email exists, a reset link is on its way.');
  }

  return (
    <AuthShell title="Reset password" subtitle="We’ll email you a reset link">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className={fieldLabelClass}>
            E-mail
          </label>
          <input id="email" name="email" type="email" required className={underlineInputClass} />
        </div>
        {message && <p className="text-sm text-accent-700">{message}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? 'Sending…' : 'Send reset link'} <ArrowIcon />
        </button>
      </form>
      <p className="mt-6 text-center text-[13px] text-neutral-600">
        <Link href="/login" className="font-semibold text-accent-600 no-underline hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
