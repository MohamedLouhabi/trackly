'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  AuthShell,
  ArrowIcon,
  buttonClass,
  fieldLabelClass,
  underlineInputClass,
} from '@/components/AuthShell';

/**
 * Reached via the reset email -> /auth/callback exchanges the code into a
 * recovery session cookie -> redirects here. The user is authenticated in a
 * recovery context and can set a new password via updateUser().
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') ?? '');
    if (password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 10 characters with a letter and a number.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Could not update the password. The link may have expired.');
      return;
    }
    router.push('/login');
  }

  return (
    <AuthShell title="Set a new password">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className={fieldLabelClass}>
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="min 10 chars, letters + numbers"
            required
            minLength={10}
            className={underlineInputClass}
          />
        </div>
        {error && <p className="text-sm text-accent2-600">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? 'Saving…' : 'Update password'} <ArrowIcon />
        </button>
      </form>
    </AuthShell>
  );
}
