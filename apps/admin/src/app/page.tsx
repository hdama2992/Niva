'use client';

import { FormEvent, useMemo, useState } from 'react';

type ReviewStatus = 'APPROVED' | 'NEEDS_REVIEW' | 'PENDING' | 'REJECTED';

type VerificationReview = {
  createdAt: string;
  id: string;
  reason: string | null;
  selfieStoragePath: string | null;
  status: ReviewStatus;
  user: {
    displayName: string | null;
    profile: { city: string | null } | null;
    username: string | null;
  };
  userId: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<VerificationReview[]>([]);
  const [reviewingUserId, setReviewingUserId] = useState<string>();
  const [viewingUserId, setViewingUserId] = useState<string>();

  const counts = useMemo(
    () => ({
      approved: reviews.filter((review) => review.status === 'APPROVED').length,
      pending: reviews.filter((review) => review.status === 'PENDING').length,
      needsReview: reviews.filter((review) => review.status === 'NEEDS_REVIEW').length,
    }),
    [reviews],
  );

  const loadReviews = async (event?: FormEvent) => {
    event?.preventDefault();
    const key = adminKey.trim();

    if (!key) {
      setError('Enter the admin key to load the verification queue.');
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`${apiUrl}/admin/verification-reviews`, {
        headers: { 'x-niva-admin-key': key },
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as { reviews: VerificationReview[] };
      setReviews(payload.reviews);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the verification queue.',
      );
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (
    review: VerificationReview,
    status: Exclude<ReviewStatus, 'PENDING'>,
    reason?: string,
  ) => {
    setReviewingUserId(review.userId);
    setError(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/admin/verification-reviews/${review.userId}`,
        {
          body: JSON.stringify({
            reviewerId: 'niva-admin',
            reason: reason?.trim() || undefined,
            status,
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-niva-admin-key': adminKey.trim(),
          },
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setReviews((current) =>
        current.map((item) =>
          item.userId === review.userId
            ? { ...item, reason: reason?.trim() || null, status }
            : item,
        ),
      );
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : 'Unable to update this verification review.',
      );
    } finally {
      setReviewingUserId(undefined);
    }
  };

  const viewSelfie = async (review: VerificationReview) => {
    if (!review.selfieStoragePath) {
      setError('This older review does not have a private selfie storage path.');
      return;
    }

    setViewingUserId(review.userId);
    setError(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/admin/verification-reviews/${review.userId}/selfie`,
        { headers: { 'x-niva-admin-key': adminKey.trim() } },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = (await response.json()) as { url: string };
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (viewerError) {
      setError(
        viewerError instanceof Error
          ? viewerError.message
          : 'Unable to open this verification selfie.',
      );
    } finally {
      setViewingUserId(undefined);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8 text-stone-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-rose-700">Niva Admin</p>
            <h1 className="text-4xl font-bold tracking-tight">Selfie review queue</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              Approve or hold join-time selfie submissions. The backend applies the
              verification status and trust-tier updates after each decision.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Pending" value={counts.pending} />
            <Metric label="Needs review" value={counts.needsReview} />
            <Metric label="Approved" value={counts.approved} />
          </div>
        </header>

        <form
          className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-5 shadow-sm md:flex-row md:items-end"
          onSubmit={(event) => void loadReviews(event)}
        >
          <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-stone-800">
            Admin key
            <input
              autoComplete="current-password"
              className="min-h-11 rounded-md border border-stone-300 bg-white px-3 text-base font-normal outline-none ring-rose-300 focus:ring-2"
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="NIVA_ADMIN_KEY"
              type="password"
              value={adminKey}
            />
          </label>
          <button
            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Loading...' : 'Load queue'}
          </button>
        </form>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
            {error}
          </p>
        ) : null}

        {reviews.length ? (
          <section className="grid gap-3">
            {reviews.map((review) => (
              <ReviewCard
                busy={reviewingUserId === review.userId}
                key={review.id}
                onUpdate={updateReview}
                onViewSelfie={viewSelfie}
                review={review}
                viewing={viewingUserId === review.userId}
              />
            ))}
          </section>
        ) : (
          <section className="border-y border-stone-200 py-12 text-center">
            <h2 className="text-lg font-bold">Load the review queue</h2>
            <p className="mt-2 text-sm text-stone-600">
              Enter the backend&apos;s `NIVA_ADMIN_KEY` above. No admin credential is
              stored in this dashboard.
            </p>
          </section>
        )}

        <section className="grid gap-4 border-t border-stone-200 pt-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">What the admin key means</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              `NIVA_ADMIN_KEY` is a beta-only shared credential sent as
              `x-niva-admin-key`. The backend rejects queue reads and review actions
              without it.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Dashboard and backend</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              This dashboard is the operator interface. The backend remains the source
              of truth for review decisions, verification status, trust score, and tier.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function ReviewCard({
  busy,
  onUpdate,
  onViewSelfie,
  review,
  viewing,
}: {
  busy: boolean;
  onUpdate: (
    review: VerificationReview,
    status: Exclude<ReviewStatus, 'PENDING'>,
    reason?: string,
  ) => Promise<void>;
  onViewSelfie: (review: VerificationReview) => Promise<void>;
  review: VerificationReview;
  viewing: boolean;
}) {
  const [reason, setReason] = useState(review.reason ?? '');
  const submittedAt = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(review.createdAt));

  return (
    <article className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-rose-700">{review.status}</p>
        <h2 className="mt-1 text-lg font-bold">
          {review.user.displayName ?? 'Niva member'}
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          @{review.user.username ?? 'pending'} · {review.user.profile?.city ?? 'City not set'} · {submittedAt}
        </p>
        <button
          className="mt-3 text-sm font-semibold text-teal-800 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!review.selfieStoragePath || viewing}
          onClick={() => void onViewSelfie(review)}
          type="button"
        >
          {viewing ? 'Opening selfie...' : 'Open submitted selfie'}
        </button>
      </div>
      <div className="grid gap-2 lg:w-80">
        <input
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm outline-none ring-rose-300 focus:ring-2"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Review note (optional)"
          value={reason}
        />
        <div className="grid grid-cols-3 gap-2">
          <button
            className="min-h-10 rounded-md bg-teal-700 px-2 text-sm font-bold text-white disabled:opacity-60"
            disabled={busy || review.status === 'APPROVED'}
            onClick={() => void onUpdate(review, 'APPROVED', reason)}
            type="button"
          >
            Approve
          </button>
          <button
            className="min-h-10 rounded-md border border-amber-400 bg-amber-50 px-2 text-sm font-bold text-amber-950 disabled:opacity-60"
            disabled={busy || review.status === 'NEEDS_REVIEW'}
            onClick={() => void onUpdate(review, 'NEEDS_REVIEW', reason)}
            type="button"
          >
            Hold
          </button>
          <button
            className="min-h-10 rounded-md border border-rose-300 bg-rose-50 px-2 text-sm font-bold text-rose-900 disabled:opacity-60"
            disabled={busy || review.status === 'REJECTED'}
            onClick={() => void onUpdate(review, 'REJECTED', reason)}
            type="button"
          >
            Reject
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold text-stone-500">{label}</p>
    </div>
  );
}
