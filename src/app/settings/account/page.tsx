'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Account — password and deletion, inside the settings shell.
 * Same two routes as before; the chrome and inputs now come from the app
 * identity instead of one-off utility classes.
 */
export default function AccountPage() {
  const router = useRouter();

  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const [confirm, setConfirm] = useState('');
  const [delLoading, setDelLoading] = useState(false);
  const [delErr, setDelErr] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwLoading(true);
    setPwMsg(null);
    setPwErr(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: form.get('currentPassword'),
        newPassword: form.get('newPassword'),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPwLoading(false);
    if (!res.ok) {
      setPwErr(data.error ?? 'Could not update the password.');
      return;
    }
    setPwMsg('Password updated.');
    (e.target as HTMLFormElement).reset();
  }

  async function deleteAccount() {
    setDelLoading(true);
    setDelErr(null);
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm }),
    });
    setDelLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDelErr(data.error ?? 'Could not delete the account.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <div className="block">
        <h3>Change password</h3>
        <p className="b-sub">At least 10 characters, with letters and numbers.</p>
        <form onSubmit={changePassword} className="stackform">
          <div>
            <label className="field-label" htmlFor="currentPassword">
              Current password
            </label>
            <input id="currentPassword" name="currentPassword" type="password" required className="input" />
          </div>
          <div>
            <label className="field-label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={10}
              className="input"
            />
          </div>
          {pwErr && <p className="err">{pwErr}</p>}
          {pwMsg && <p className="ok">{pwMsg}</p>}
          <div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      <div className="plan-card danger">
        <div className="row">
          <h2 style={{ fontSize: 20 }}>Delete account</h2>
        </div>
        <p className="b-sub" style={{ marginTop: 'var(--space-3)' }}>
          This permanently deletes your account and everything it owns. Type{' '}
          <strong>DELETE</strong> to confirm.
        </p>
        <div className="stackform">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            className="input"
          />
          {delErr && <p className="err">{delErr}</p>}
          <div>
            <button
              onClick={deleteAccount}
              disabled={confirm !== 'DELETE' || delLoading}
              className="btn btn-danger"
            >
              {delLoading ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
