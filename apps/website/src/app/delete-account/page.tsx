'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const company =
      new FormData(event.currentTarget).get('company')?.toString() ?? '';
    setStatus('saving');
    setError(undefined);
    try {
      const response = await fetch(`${apiUrl}/account-deletion-requests`, {
        body: JSON.stringify({ company, identifier }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      if (!response.ok) throw new Error(await response.text());
      setStatus('saved');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to submit this request.',
      );
      setStatus('idle');
    }
  };

  return (
    <main className="legal-page">
      <nav>
        <Link href="/">niva.</Link>
      </nav>
      <article>
        <p className="eyebrow">Account deletion</p>
        <h1>Remove your Niva account and data.</h1>
        <h2>Delete immediately in the app</h2>
        <p>
          Open Profile, choose Settings, select Delete account, and confirm.
          Niva deletes the Firebase sign-in identity, profile, memberships,
          cohort messages, trust records, private selfie, and profile images.
        </p>
        <h2>Cannot access the app?</h2>
        {status === 'saved' ? (
          <div className="legal-success">
            <h3>Request received.</h3>
            <p>
              The care team will verify account ownership before deletion and
              follow up through the account contact method.
            </p>
          </div>
        ) : (
          <form className="legal-form" onSubmit={submit}>
            <label aria-hidden="true" className="honeypot">
              Company
              <input autoComplete="off" name="company" tabIndex={-1} />
            </label>
            <label>
              Email or international phone number
              <input
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com or +919876543210"
                required
                value={identifier}
              />
            </label>
            <p>
              For safety, submitting this form does not delete an account
              immediately. Niva verifies ownership before processing the
              request.
            </p>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="button button-coral"
              disabled={status === 'saving'}
              type="submit"
            >
              {status === 'saving' ? 'Submitting...' : 'Request deletion'}
            </button>
          </form>
        )}
      </article>
    </main>
  );
}
