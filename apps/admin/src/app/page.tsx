'use client';

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  firebaseAdminUiConfigured,
  getAdminFirebaseAuth,
} from '../lib/firebase';

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

type HostApproval = {
  id: string;
  reason: string | null;
  requestedAt: string | null;
  status: 'APPROVED' | 'NOT_REQUESTED' | 'PENDING' | 'REJECTED';
  user: {
    displayName: string | null;
    id: string;
    profile: { city: string | null; interests: string[] } | null;
    trust: { score: number; tier: string } | null;
    username: string | null;
  };
  userId: string;
};

type AdminActivity = {
  city: string;
  host: { displayName: string | null; username: string | null } | null;
  id: string;
  locationName: string;
  schedule?: string;
  startsAt: string;
  title: string;
  type: 'CIRCLE' | 'EVENT';
};

type AnalyticsSummary = {
  attendanceRecorded: number;
  continuityPreferences: number;
  feedbackSubmitted: number;
  icebreakersViewed: number;
  joinRequests: number;
  membershipApprovals: number;
  recommendationViews: number;
  repeatParticipants: number;
};

type AdminMember = {
  createdAt: string;
  displayName: string | null;
  email: string | null;
  id: string;
  profile: {
    city: string;
    interests: string[];
    profileCompleteness: number;
  } | null;
  selfieVerification: { status: string } | null;
  trust: {
    score: number;
    tier: string;
    verificationStatus: string;
  } | null;
  username: string | null;
  phone: string | null;
};

type AccountDeletionRequest = {
  createdAt: string;
  id: string;
  identifier: string;
  status: 'COMPLETED' | 'IN_REVIEW' | 'PENDING' | 'REJECTED';
};

type BetaAccessRequest = {
  city: string;
  createdAt: string;
  email: string;
  id: string;
  interest: string;
  status: 'DECLINED' | 'INVITED' | 'PENDING';
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function Home() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [idToken, setIdToken] = useState('');
  const [error, setError] = useState<string | undefined>(() =>
    firebaseAdminUiConfigured
      ? undefined
      : 'Add the public Firebase web configuration to apps/admin/.env.local.',
  );
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<VerificationReview[]>([]);
  const [approvals, setApprovals] = useState<HostApproval[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary>();
  const [activityCity, setActivityCity] = useState('');
  const [activityQuery, setActivityQuery] = useState('');
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<
    AccountDeletionRequest[]
  >([]);
  const [updatingDeletionId, setUpdatingDeletionId] = useState<string>();
  const [betaRequests, setBetaRequests] = useState<BetaAccessRequest[]>([]);
  const [updatingBetaId, setUpdatingBetaId] = useState<string>();
  const [memberCity, setMemberCity] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [reviewingUserId, setReviewingUserId] = useState<string>();
  const [searchingActivities, setSearchingActivities] = useState(false);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string>();
  const [updatingHostId, setUpdatingHostId] = useState<string>();
  const [cancellingActivityId, setCancellingActivityId] = useState<string>();
  const [updatingLocationId, setUpdatingLocationId] = useState<string>();
  const [loaded, setLoaded] = useState(false);

  const counts = useMemo(
    () => ({
      approved: reviews.filter((review) => review.status === 'APPROVED').length,
      pending: reviews.filter((review) => review.status === 'PENDING').length,
      needsReview: reviews.filter((review) => review.status === 'NEEDS_REVIEW')
        .length,
    }),
    [reviews],
  );

  useEffect(() => {
    if (!firebaseAdminUiConfigured) {
      return;
    }

    const unsubscribe = onAuthStateChanged(
      getAdminFirebaseAuth(),
      async (user) => {
        setIdToken(user ? await user.getIdToken() : '');
        if (!user) {
          setLoaded(false);
          setReviews([]);
          setApprovals([]);
          setActivities([]);
          setMembers([]);
          setDeletionRequests([]);
          setBetaRequests([]);
        }
      },
    );
    return unsubscribe;
  }, []);

  const authorizationHeaders = (token = idToken) => ({
    Authorization: `Bearer ${token}`,
  });

  const signInAdmin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const credential = await signInWithEmailAndPassword(
        getAdminFirebaseAuth(),
        adminEmail.trim(),
        adminPassword,
      );
      const token = await credential.user.getIdToken();
      setIdToken(token);
      setAdminPassword('');
      await loadReviews(undefined, token);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Unable to sign in to Niva Admin.',
      );
      setLoading(false);
    }
  };

  const loadReviews = async (event?: FormEvent, tokenOverride?: string) => {
    event?.preventDefault();
    const token = tokenOverride ?? idToken;

    if (!token) {
      setError('Sign in with an approved Niva administrator account.');
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const headers = authorizationHeaders(token);
      const [
        reviewsResponse,
        approvalsResponse,
        activitiesResponse,
        analyticsResponse,
        deletionRequestsResponse,
        betaRequestsResponse,
      ] = await Promise.all([
        fetch(`${apiUrl}/admin/verification-reviews`, { headers }),
        fetch(`${apiUrl}/admin/host-approvals?status=PENDING`, { headers }),
        fetch(`${apiUrl}/admin/activities?status=PUBLISHED`, { headers }),
        fetch(`${apiUrl}/admin/analytics/summary`, { headers }),
        fetch(`${apiUrl}/admin/account-deletion-requests?status=PENDING`, {
          headers,
        }),
        fetch(`${apiUrl}/admin/beta-access-requests?status=PENDING`, {
          headers,
        }),
      ]);

      if (
        !reviewsResponse.ok ||
        !approvalsResponse.ok ||
        !activitiesResponse.ok ||
        !analyticsResponse.ok ||
        !deletionRequestsResponse.ok ||
        !betaRequestsResponse.ok
      ) {
        const failedResponse = [
          reviewsResponse,
          approvalsResponse,
          activitiesResponse,
          analyticsResponse,
          deletionRequestsResponse,
          betaRequestsResponse,
        ].find((response) => !response.ok);
        throw new Error(
          (await failedResponse?.text()) || 'Unable to load admin queues.',
        );
      }

      const [
        reviewsPayload,
        approvalsPayload,
        activitiesPayload,
        analyticsPayload,
        deletionRequestsPayload,
        betaRequestsPayload,
      ] = (await Promise.all([
        reviewsResponse.json(),
        approvalsResponse.json(),
        activitiesResponse.json(),
        analyticsResponse.json(),
        deletionRequestsResponse.json(),
        betaRequestsResponse.json(),
      ])) as [
        { reviews: VerificationReview[] },
        { approvals: HostApproval[] },
        {
          circles: Omit<AdminActivity, 'type'>[];
          events: Omit<AdminActivity, 'type'>[];
        },
        { analytics: AnalyticsSummary },
        { requests: AccountDeletionRequest[] },
        { requests: BetaAccessRequest[] },
      ];
      setReviews(reviewsPayload.reviews);
      setApprovals(approvalsPayload.approvals);
      setActivities([
        ...activitiesPayload.events.map((activity) => ({
          ...activity,
          type: 'EVENT' as const,
        })),
        ...activitiesPayload.circles.map((activity) => ({
          ...activity,
          type: 'CIRCLE' as const,
        })),
      ]);
      setAnalytics(analyticsPayload.analytics);
      setDeletionRequests(deletionRequestsPayload.requests);
      setBetaRequests(betaRequestsPayload.requests);
      setLoaded(true);
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

  const updateHostApproval = async (
    approval: HostApproval,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    setUpdatingHostId(approval.userId);
    setError(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/admin/host-approvals/${approval.userId}`,
        {
          body: JSON.stringify({ status }),
          headers: {
            'Content-Type': 'application/json',
            ...authorizationHeaders(),
          },
          method: 'PATCH',
        },
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setApprovals((current) =>
        current.filter((item) => item.userId !== approval.userId),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update host access.',
      );
    } finally {
      setUpdatingHostId(undefined);
    }
  };

  const cancelActivity = async (activity: AdminActivity, reason: string) => {
    setCancellingActivityId(activity.id);
    setError(undefined);
    try {
      const path =
        activity.type === 'EVENT'
          ? `/admin/events/${activity.id}/cancel`
          : `/admin/circles/${activity.id}/cancel`;
      const response = await fetch(`${apiUrl}${path}`, {
        body: JSON.stringify({ reason }),
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeaders(),
        },
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      );
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Unable to cancel this activity.',
      );
    } finally {
      setCancellingActivityId(undefined);
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
            ...authorizationHeaders(),
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
      setError(
        'This older review does not have a private selfie storage path.',
      );
      return;
    }

    setViewingUserId(review.userId);
    setError(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/admin/verification-reviews/${review.userId}/selfie`,
        { headers: authorizationHeaders() },
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

  const searchActivities = async (event?: FormEvent) => {
    event?.preventDefault();
    setSearchingActivities(true);
    setError(undefined);
    try {
      const params = new URLSearchParams({ status: 'PUBLISHED' });
      if (activityQuery.trim()) params.set('q', activityQuery.trim());
      if (activityCity.trim()) params.set('city', activityCity.trim());
      const response = await fetch(`${apiUrl}/admin/activities?${params}`, {
        headers: authorizationHeaders(),
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = (await response.json()) as {
        circles: Omit<AdminActivity, 'type'>[];
        events: Omit<AdminActivity, 'type'>[];
      };
      setActivities([
        ...payload.events.map((activity) => ({
          ...activity,
          type: 'EVENT' as const,
        })),
        ...payload.circles.map((activity) => ({
          ...activity,
          type: 'CIRCLE' as const,
        })),
      ]);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : 'Unable to search activities.',
      );
    } finally {
      setSearchingActivities(false);
    }
  };

  const searchMembers = async (event?: FormEvent) => {
    event?.preventDefault();
    setSearchingMembers(true);
    setError(undefined);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (memberQuery.trim()) params.set('q', memberQuery.trim());
      if (memberCity.trim()) params.set('city', memberCity.trim());
      const response = await fetch(`${apiUrl}/admin/members?${params}`, {
        headers: authorizationHeaders(),
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = (await response.json()) as { members: AdminMember[] };
      setMembers(payload.members);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : 'Unable to search members.',
      );
    } finally {
      setSearchingMembers(false);
    }
  };

  const updateActivityLocation = async (
    activity: AdminActivity,
    locationName: string,
    city: string,
  ) => {
    setUpdatingLocationId(activity.id);
    setError(undefined);
    try {
      const path =
        activity.type === 'EVENT'
          ? `/admin/events/${activity.id}/location`
          : `/admin/circles/${activity.id}/location`;
      const response = await fetch(`${apiUrl}${path}`, {
        body: JSON.stringify({ city, locationName }),
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeaders(),
        },
        method: 'PATCH',
      });
      if (!response.ok) throw new Error(await response.text());
      setActivities((current) =>
        current.map((item) =>
          item.id === activity.id && item.type === activity.type
            ? { ...item, city, locationName }
            : item,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update the activity location.',
      );
    } finally {
      setUpdatingLocationId(undefined);
    }
  };

  const updateDeletionRequest = async (
    requestId: string,
    status: 'COMPLETED' | 'IN_REVIEW' | 'REJECTED',
  ) => {
    setUpdatingDeletionId(requestId);
    setError(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/admin/account-deletion-requests/${requestId}`,
        {
          body: JSON.stringify({ status }),
          headers: {
            'Content-Type': 'application/json',
            ...authorizationHeaders(),
          },
          method: 'PATCH',
        },
      );
      if (!response.ok) throw new Error(await response.text());
      setDeletionRequests((current) =>
        current.filter((request) => request.id !== requestId),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this deletion request.',
      );
    } finally {
      setUpdatingDeletionId(undefined);
    }
  };

  const updateBetaRequest = async (
    requestId: string,
    status: 'DECLINED' | 'INVITED',
  ) => {
    setUpdatingBetaId(requestId);
    setError(undefined);
    try {
      const response = await fetch(
        `${apiUrl}/admin/beta-access-requests/${requestId}`,
        {
          body: JSON.stringify({ status }),
          headers: {
            'Content-Type': 'application/json',
            ...authorizationHeaders(),
          },
          method: 'PATCH',
        },
      );
      if (!response.ok) throw new Error(await response.text());
      setBetaRequests((current) =>
        current.filter((request) => request.id !== requestId),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this beta request.',
      );
    } finally {
      setUpdatingBetaId(undefined);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8 text-stone-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-rose-700">
              Niva Admin
            </p>
            <h1 className="text-4xl font-bold tracking-tight">
              Selfie review queue
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              Approve or hold join-time selfie submissions. The backend applies
              the verification status and trust-tier updates after each
              decision.
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
          onSubmit={
            idToken
              ? (event) => void loadReviews(event)
              : (event) => void signInAdmin(event)
          }
        >
          <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-stone-800">
            Admin email
            <input
              autoComplete="email"
              className="min-h-11 rounded-md border border-stone-300 bg-white px-3 text-base font-normal outline-none ring-rose-300 focus:ring-2"
              disabled={Boolean(idToken)}
              onChange={(event) => setAdminEmail(event.target.value)}
              placeholder="admin@niva.app"
              type="email"
              value={adminEmail}
            />
          </label>
          {!idToken ? (
            <label className="flex flex-1 flex-col gap-2 text-sm font-semibold text-stone-800">
              Password
              <input
                autoComplete="current-password"
                className="min-h-11 rounded-md border border-stone-300 bg-white px-3 text-base font-normal outline-none ring-rose-300 focus:ring-2"
                onChange={(event) => setAdminPassword(event.target.value)}
                type="password"
                value={adminPassword}
              />
            </label>
          ) : null}
          <button
            className="min-h-11 rounded-md bg-teal-700 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Loading...' : idToken ? 'Refresh dashboard' : 'Sign in'}
          </button>
          {idToken ? (
            <button
              className="min-h-11 rounded-md border border-stone-300 px-4 text-sm font-bold text-stone-700"
              onClick={() => void signOut(getAdminFirebaseAuth())}
              type="button"
            >
              Sign out
            </button>
          ) : null}
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
              Sign in with a Firebase account that has active Niva admin access.
            </p>
          </section>
        )}

        {loaded ? (
          <section className="grid gap-4 border-t border-stone-200 pt-6">
            <div>
              <p className="text-sm font-semibold text-sky-700">Member care</p>
              <h2 className="mt-1 text-2xl font-bold">Member lookup</h2>
              <p className="mt-1 text-sm text-stone-600">
                Find a member by name, username, or city without exposing phone
                numbers.
              </p>
            </div>
            <form
              className="grid gap-3 md:grid-cols-[1fr_12rem_auto]"
              onSubmit={(event) => void searchMembers(event)}
            >
              <input
                className="min-h-11 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none ring-teal-300 focus:ring-2"
                onChange={(event) => setMemberQuery(event.target.value)}
                placeholder="Name, username, or city"
                value={memberQuery}
              />
              <input
                className="min-h-11 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none ring-teal-300 focus:ring-2"
                onChange={(event) => setMemberCity(event.target.value)}
                placeholder="City filter"
                value={memberCity}
              />
              <button
                className="min-h-11 rounded-md border border-teal-700 px-4 text-sm font-bold text-teal-800 disabled:opacity-60"
                disabled={searchingMembers}
                type="submit"
              >
                {searchingMembers ? 'Searching...' : 'Search members'}
              </button>
            </form>
            {members.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {members.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            ) : (
              <p className="border-y border-stone-200 py-5 text-sm text-stone-600">
                Search members when you need context for verification or host
                review.
              </p>
            )}
          </section>
        ) : null}

        {loaded ? (
          <section className="grid gap-4 border-t border-stone-200 pt-6">
            <div>
              <p className="text-sm font-semibold text-teal-700">
                Website waitlist
              </p>
              <h2 className="mt-1 text-2xl font-bold">Beta access requests</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Requests submitted on the Niva website are persisted here for
                measured invitations.
              </p>
            </div>
            {betaRequests.length ? (
              <div className="grid gap-3">
                {betaRequests.map((request) => (
                  <article
                    className="flex flex-col gap-3 rounded-md border border-stone-200 bg-white p-4 md:flex-row md:items-center"
                    key={request.id}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-stone-900">
                        {request.email}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        {request.city} · {request.interest}
                      </p>
                    </div>
                    <button
                      className="min-h-10 rounded-md bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-60"
                      disabled={updatingBetaId === request.id}
                      onClick={() =>
                        void updateBetaRequest(request.id, 'INVITED')
                      }
                      type="button"
                    >
                      Mark invited
                    </button>
                    <button
                      className="min-h-10 rounded-md border border-stone-300 px-3 text-sm font-bold text-stone-700 disabled:opacity-60"
                      disabled={updatingBetaId === request.id}
                      onClick={() =>
                        void updateBetaRequest(request.id, 'DECLINED')
                      }
                      type="button"
                    >
                      Decline
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="border-y border-stone-200 py-6 text-sm text-stone-600">
                No pending beta requests.
              </p>
            )}
          </section>
        ) : null}

        {loaded ? (
          <section className="grid gap-4 border-t border-stone-200 pt-6">
            <div>
              <p className="text-sm font-semibold text-rose-700">
                Privacy operations
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Account deletion requests
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Verify ownership using the account contact method before
                deleting any account. Completing this queue item records the
                operational decision; signed-in members can delete immediately
                from the app.
              </p>
            </div>
            {deletionRequests.length ? (
              <div className="grid gap-3">
                {deletionRequests.map((request) => (
                  <article
                    className="flex flex-col gap-3 rounded-md border border-stone-200 bg-white p-4 md:flex-row md:items-center"
                    key={request.id}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-stone-900">
                        {request.identifier}
                      </p>
                      <p className="mt-1 text-sm text-stone-500">
                        Requested {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="min-h-10 rounded-md border border-amber-600 px-3 text-sm font-bold text-amber-800 disabled:opacity-60"
                      disabled={updatingDeletionId === request.id}
                      onClick={() =>
                        void updateDeletionRequest(request.id, 'IN_REVIEW')
                      }
                      type="button"
                    >
                      Start review
                    </button>
                    <button
                      className="min-h-10 rounded-md bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-60"
                      disabled={updatingDeletionId === request.id}
                      onClick={() =>
                        void updateDeletionRequest(request.id, 'COMPLETED')
                      }
                      type="button"
                    >
                      Mark completed
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="border-y border-stone-200 py-6 text-sm text-stone-600">
                No pending account deletion requests.
              </p>
            )}
          </section>
        ) : null}

        {loaded ? (
          <section className="grid gap-4 border-t border-stone-200 pt-6">
            <div>
              <p className="text-sm font-semibold text-violet-700">
                Closed beta
              </p>
              <h2 className="mt-1 text-2xl font-bold">Community signals</h2>
              <p className="mt-1 text-sm text-stone-600">
                Aggregate product metrics only. No participant-level analytics
                are shown here.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Join requests"
                value={analytics?.joinRequests ?? 0}
              />
              <Metric
                label="Approvals"
                value={analytics?.membershipApprovals ?? 0}
              />
              <Metric
                label="Attendance"
                value={analytics?.attendanceRecorded ?? 0}
              />
              <Metric
                label="Feedback"
                value={analytics?.feedbackSubmitted ?? 0}
              />
              <Metric
                label="Icebreakers"
                value={analytics?.icebreakersViewed ?? 0}
              />
              <Metric
                label="Recommendation views"
                value={analytics?.recommendationViews ?? 0}
              />
              <Metric
                label="Continuity choices"
                value={analytics?.continuityPreferences ?? 0}
              />
              <Metric
                label="Repeat participants"
                value={analytics?.repeatParticipants ?? 0}
              />
            </div>
          </section>
        ) : null}

        {loaded ? (
          <section className="grid gap-4 border-t border-stone-200 pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-700">Community</p>
                <h2 className="mt-1 text-2xl font-bold">Host approvals</h2>
              </div>
              <p className="text-sm font-semibold text-stone-500">
                {approvals.length} pending
              </p>
            </div>
            {approvals.length ? (
              <div className="grid gap-3">
                {approvals.map((approval) => (
                  <HostApprovalCard
                    approval={approval}
                    busy={updatingHostId === approval.userId}
                    key={approval.userId}
                    onUpdate={updateHostApproval}
                  />
                ))}
              </div>
            ) : (
              <p className="border-y border-stone-200 py-6 text-sm text-stone-600">
                No host requests waiting for review.
              </p>
            )}
          </section>
        ) : null}

        {loaded ? (
          <section className="grid gap-4 border-t border-stone-200 pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  Operations
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  Published activities
                </h2>
              </div>
              <p className="text-sm font-semibold text-stone-500">
                {activities.length} live
              </p>
            </div>
            <form
              className="grid gap-3 md:grid-cols-[1fr_12rem_auto]"
              onSubmit={(event) => void searchActivities(event)}
            >
              <input
                className="min-h-11 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none ring-teal-300 focus:ring-2"
                onChange={(event) => setActivityQuery(event.target.value)}
                placeholder="Activity or location"
                value={activityQuery}
              />
              <input
                className="min-h-11 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none ring-teal-300 focus:ring-2"
                onChange={(event) => setActivityCity(event.target.value)}
                placeholder="City filter"
                value={activityCity}
              />
              <button
                className="min-h-11 rounded-md border border-teal-700 px-4 text-sm font-bold text-teal-800 disabled:opacity-60"
                disabled={searchingActivities}
                type="submit"
              >
                {searchingActivities ? 'Searching...' : 'Search activities'}
              </button>
            </form>
            {activities.length ? (
              <div className="grid gap-3">
                {activities.map((activity) => (
                  <ActivityCancellationCard
                    activity={activity}
                    busy={cancellingActivityId === activity.id}
                    key={`${activity.type}-${activity.id}`}
                    onCancel={cancelActivity}
                    onUpdateLocation={updateActivityLocation}
                    updatingLocation={updatingLocationId === activity.id}
                  />
                ))}
              </div>
            ) : (
              <p className="border-y border-stone-200 py-6 text-sm text-stone-600">
                No published activities.
              </p>
            )}
          </section>
        ) : null}

        <section className="grid gap-4 border-t border-stone-200 pt-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">Named administrator access</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Every dashboard request carries the signed-in administrator&apos;s
              Firebase ID token. The backend checks that identity against its
              active admin role before allowing any queue read or action.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Dashboard and backend</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              This dashboard is the operator interface. The backend remains the
              source of truth for review decisions, verification status, trust
              score, and tier.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function HostApprovalCard({
  approval,
  busy,
  onUpdate,
}: {
  approval: HostApproval;
  busy: boolean;
  onUpdate: (
    approval: HostApproval,
    status: 'APPROVED' | 'REJECTED',
  ) => Promise<void>;
}) {
  return (
    <article className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold text-teal-700">
          {approval.user.trust?.tier ?? 'TRUSTED'} ·{' '}
          {approval.user.trust?.score ?? 0} trust points
        </p>
        <h3 className="mt-1 text-lg font-bold">
          {approval.user.displayName ?? approval.user.username ?? 'Niva member'}
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          @{approval.user.username ?? 'pending'} ·{' '}
          {approval.user.profile?.city ?? 'City not set'}
        </p>
        {approval.user.profile?.interests?.length ? (
          <p className="mt-3 text-sm text-stone-700">
            {approval.user.profile.interests.join(' · ')}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 lg:w-64">
        <button
          className="min-h-10 rounded-md bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void onUpdate(approval, 'APPROVED')}
          type="button"
        >
          Approve
        </button>
        <button
          className="min-h-10 rounded-md border border-rose-300 bg-rose-50 px-3 text-sm font-bold text-rose-900 disabled:opacity-60"
          disabled={busy}
          onClick={() => void onUpdate(approval, 'REJECTED')}
          type="button"
        >
          Reject
        </button>
      </div>
    </article>
  );
}

function ActivityCancellationCard({
  activity,
  busy,
  onCancel,
  onUpdateLocation,
  updatingLocation,
}: {
  activity: AdminActivity;
  busy: boolean;
  onCancel: (activity: AdminActivity, reason: string) => Promise<void>;
  onUpdateLocation: (
    activity: AdminActivity,
    locationName: string,
    city: string,
  ) => Promise<void>;
  updatingLocation: boolean;
}) {
  const [reason, setReason] = useState('');
  const [city, setCity] = useState(activity.city);
  const [locationName, setLocationName] = useState(activity.locationName);
  const when = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(activity.startsAt));
  const host =
    activity.host?.displayName ?? activity.host?.username ?? 'Niva host';
  const canCancel = reason.trim().length >= 3 && !busy;
  const canUpdateLocation =
    locationName.trim().length >= 3 &&
    city.trim().length >= 2 &&
    !updatingLocation;

  return (
    <article className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_22rem] lg:items-end">
      <div>
        <p className="text-sm font-semibold text-amber-700">
          {activity.type === 'EVENT' ? 'Event' : 'Circle'}
        </p>
        <h3 className="mt-1 text-lg font-bold">{activity.title}</h3>
        <p className="mt-1 text-sm text-stone-600">
          {when} · {activity.locationName} · {activity.city}
        </p>
        <p className="mt-1 text-sm text-stone-600">
          Hosted by {host}
          {activity.schedule ? ` · ${activity.schedule}` : ''}
        </p>
      </div>
      <div className="grid gap-2">
        <input
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm outline-none ring-teal-300 focus:ring-2"
          onChange={(event) => setLocationName(event.target.value)}
          placeholder="Updated location"
          value={locationName}
        />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            className="min-h-10 rounded-md border border-stone-300 px-3 text-sm outline-none ring-teal-300 focus:ring-2"
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            value={city}
          />
          <button
            className="min-h-10 rounded-md border border-teal-700 px-3 text-sm font-bold text-teal-800 disabled:opacity-60"
            disabled={!canUpdateLocation}
            onClick={() =>
              void onUpdateLocation(activity, locationName.trim(), city.trim())
            }
            type="button"
          >
            {updatingLocation ? 'Saving...' : 'Update location'}
          </button>
        </div>
        <input
          className="min-h-10 rounded-md border border-stone-300 px-3 text-sm outline-none ring-rose-300 focus:ring-2"
          onChange={(event) => setReason(event.target.value)}
          placeholder="Cancellation reason for members"
          value={reason}
        />
        <button
          className="min-h-10 rounded-md border border-rose-300 bg-rose-50 px-3 text-sm font-bold text-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canCancel}
          onClick={() => void onCancel(activity, reason.trim())}
          type="button"
        >
          {busy ? 'Cancelling...' : 'Cancel activity'}
        </button>
      </div>
    </article>
  );
}

function MemberCard({ member }: { member: AdminMember }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-sky-700">
        {member.trust?.tier ?? 'NEW'} · {member.trust?.score ?? 0} trust points
      </p>
      <h3 className="mt-1 text-lg font-bold">
        {member.displayName ?? member.username ?? 'Niva member'}
      </h3>
      <p className="mt-1 text-sm text-stone-600">
        @{member.username ?? 'pending'} ·{' '}
        {member.profile?.city ?? 'City not set'}
      </p>
      <p className="mt-3 text-sm text-stone-700">
        Verification: {member.selfieVerification?.status ?? 'NOT_STARTED'} ·
        Profile: {member.profile?.profileCompleteness ?? 0}%
      </p>
      {member.email || member.phone ? (
        <p className="mt-2 text-sm text-stone-600">
          {[member.email, member.phone].filter(Boolean).join(' · ')}
        </p>
      ) : null}
      {member.profile?.interests.length ? (
        <p className="mt-2 text-sm text-stone-600">
          {member.profile.interests.join(' · ')}
        </p>
      ) : null}
    </article>
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
          @{review.user.username ?? 'pending'} ·{' '}
          {review.user.profile?.city ?? 'City not set'} · {submittedAt}
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
