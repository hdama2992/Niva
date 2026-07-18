'use client';

/* eslint-disable @next/next/no-img-element -- moderation evidence uses signed and local object URLs that must bypass Next image optimization */

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
    profile: {
      city: string | null;
      interests: string[];
      profilePhotoUrl: string | null;
    } | null;
    username: string | null;
  };
  userId: string;
};

type AdminReport = {
  circle: { id: string; title: string } | null;
  createdAt: string;
  details: string | null;
  event: { id: string; title: string } | null;
  id: string;
  reason: string;
  reportedUser: {
    displayName: string | null;
    id: string;
    username: string | null;
  } | null;
  reporter: {
    displayName: string | null;
    id: string;
    username: string | null;
  };
  status: 'DISMISSED' | 'OPEN' | 'RESOLVED' | 'REVIEWING';
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

type AuthSession = {
  user: {
    id: string;
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function createAdminSession(idToken: string) {
  const response = await fetch(`${apiUrl}/auth/session`, {
    body: JSON.stringify({ idToken }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(
      (await response.text()) ||
        'Unable to create the Niva administrator session.',
    );
  }

  return (await response.json()) as AuthSession;
}

export default function Home() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [idToken, setIdToken] = useState('');
  const [signedInUserId, setSignedInUserId] = useState('');
  const [error, setError] = useState<string | undefined>(() =>
    firebaseAdminUiConfigured
      ? undefined
      : 'Add the public Firebase web configuration to apps/admin/.env.local.',
  );
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<VerificationReview[]>([]);
  const [approvals, setApprovals] = useState<HostApproval[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
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
  const [selfieUrls, setSelfieUrls] = useState<Record<string, string>>({});
  const [updatingReportId, setUpdatingReportId] = useState<string>();
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
        const token = user ? await user.getIdToken() : '';
        setIdToken(token);
        if (token) {
          try {
            const session = await createAdminSession(token);
            setSignedInUserId(session.user.id);
          } catch (sessionError) {
            setError(
              sessionError instanceof Error
                ? sessionError.message
                : 'Unable to restore the Niva administrator session.',
            );
          }
        }
        if (!user) {
          setSignedInUserId('');
          setLoaded(false);
          setReviews([]);
          setApprovals([]);
          setReports([]);
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
      const session = await createAdminSession(token);
      setIdToken(token);
      setSignedInUserId(session.user.id);
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
        reportsResponse,
        activitiesResponse,
        analyticsResponse,
        deletionRequestsResponse,
        betaRequestsResponse,
      ] = await Promise.all([
        fetch(`${apiUrl}/admin/verification-reviews`, { headers }),
        fetch(`${apiUrl}/admin/host-approvals?status=PENDING`, { headers }),
        fetch(`${apiUrl}/admin/reports?status=OPEN`, { headers }),
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
        !reportsResponse.ok ||
        !activitiesResponse.ok ||
        !analyticsResponse.ok ||
        !deletionRequestsResponse.ok ||
        !betaRequestsResponse.ok
      ) {
        const failedResponse = [
          reviewsResponse,
          approvalsResponse,
          reportsResponse,
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
        reportsPayload,
        activitiesPayload,
        analyticsPayload,
        deletionRequestsPayload,
        betaRequestsPayload,
      ] = (await Promise.all([
        reviewsResponse.json(),
        approvalsResponse.json(),
        reportsResponse.json(),
        activitiesResponse.json(),
        analyticsResponse.json(),
        deletionRequestsResponse.json(),
        betaRequestsResponse.json(),
      ])) as [
        { reviews: VerificationReview[] },
        { approvals: HostApproval[] },
        { reports: AdminReport[] },
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
      setReports(reportsPayload.reports);
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
      setSelfieUrls((current) => ({
        ...current,
        [review.userId]: payload.url,
      }));
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

  const updateReport = async (
    report: AdminReport,
    status: 'DISMISSED' | 'RESOLVED' | 'REVIEWING',
    confirmed: boolean,
  ) => {
    setUpdatingReportId(report.id);
    setError(undefined);
    try {
      const response = await fetch(`${apiUrl}/admin/reports/${report.id}`, {
        body: JSON.stringify({ confirmed, status }),
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeaders(),
        },
        method: 'PATCH',
      });
      if (!response.ok) throw new Error(await response.text());
      setReports((current) =>
        status === 'REVIEWING'
          ? current.map((item) =>
              item.id === report.id ? { ...item, status } : item,
            )
          : current.filter((item) => item.id !== report.id),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this report.',
      );
    } finally {
      setUpdatingReportId(undefined);
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
    <main className="min-h-screen bg-[#fcf8f2] text-[#17212e] lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="hidden min-h-screen bg-gradient-to-b from-[#082b50] to-[#031d36] px-4 py-7 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <p className="px-3 text-3xl font-black tracking-tight">Niva</p>
        <nav className="mt-9 grid gap-2 text-sm font-bold">
          <a className="rounded-xl bg-white/12 px-4 py-3" href="#review-queue">
            Review queue
          </a>
          <a
            className="rounded-xl px-4 py-3 text-white/75 hover:bg-white/10"
            href="#members"
          >
            Members
          </a>
          <a
            className="rounded-xl px-4 py-3 text-white/75 hover:bg-white/10"
            href="#account-requests"
          >
            Account requests
          </a>
          <a
            className="rounded-xl px-4 py-3 text-white/75 hover:bg-white/10"
            href="#activities"
          >
            Activities
          </a>
          <a
            className="rounded-xl px-4 py-3 text-white/75 hover:bg-white/10"
            href="#analytics"
          >
            Analytics
          </a>
        </nav>
        <div className="mt-auto rounded-2xl border border-white/15 bg-white/8 p-4 text-sm">
          <p className="font-bold">Administrator workspace</p>
          <p className="mt-1 text-xs leading-5 text-white/65">
            Every moderation action is attributed and audited.
          </p>
        </div>
      </aside>
      <section className="min-w-0 px-5 py-7 md:px-8 lg:px-10">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-4 border-b border-[#ded8cf] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold text-[#4f846f]">
                Niva Admin
              </p>
              <h1 className="text-4xl font-black tracking-tight text-[#17345b]">
                Review queue
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-[#667181]">
                Identity, host, safety, and account decisions in one auditable
                workspace.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#e4eee8] px-4 py-2 text-xs font-black text-[#315c49]">
                Production
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Metric label="Pending" value={counts.pending} />
                <Metric label="Needs review" value={counts.needsReview} />
                <Metric label="Approved" value={counts.approved} />
              </div>
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
              {loading
                ? 'Loading...'
                : idToken
                  ? 'Refresh dashboard'
                  : 'Sign in'}
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

          {signedInUserId && !loaded ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Firebase sign-in succeeded. This account&apos;s Niva user ID is{' '}
              <code className="font-mono font-semibold">{signedInUserId}</code>.
              A Niva owner must grant this ID an administrator role before the
              dashboard can load.
            </p>
          ) : null}

          {loaded ? (
            <ReviewWorkspace
              approvals={approvals}
              reports={reports}
              reviewingUserId={reviewingUserId}
              reviews={reviews}
              selfieUrls={selfieUrls}
              updatingHostId={updatingHostId}
              updatingReportId={updatingReportId}
              viewingUserId={viewingUserId}
              onUpdateHost={updateHostApproval}
              onUpdateReport={updateReport}
              onUpdateReview={updateReview}
              onViewSelfie={viewSelfie}
            />
          ) : (
            <section className="border-y border-stone-200 py-12 text-center">
              <h2 className="text-lg font-bold">Load the review queue</h2>
              <p className="mt-2 text-sm text-stone-600">
                Sign in with a Firebase account that has active Niva admin
                access.
              </p>
            </section>
          )}

          {loaded ? (
            <section
              className="grid gap-4 border-t border-stone-200 pt-6"
              id="members"
            >
              <div>
                <p className="text-sm font-semibold text-sky-700">
                  Member care
                </p>
                <h2 className="mt-1 text-2xl font-bold">Member lookup</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Find a member by name, username, or city without exposing
                  phone numbers.
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
            <section
              className="grid gap-4 border-t border-stone-200 pt-6"
              id="account-requests"
            >
              <div>
                <p className="text-sm font-semibold text-teal-700">
                  Website waitlist
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  Beta access requests
                </h2>
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
                          Requested{' '}
                          {new Date(request.createdAt).toLocaleString()}
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
            <section
              className="grid gap-4 border-t border-stone-200 pt-6"
              id="analytics"
            >
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
                  <p className="text-sm font-semibold text-teal-700">
                    Community
                  </p>
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
            <section
              className="grid gap-4 border-t border-stone-200 pt-6"
              id="activities"
            >
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
                Every dashboard request carries the signed-in
                administrator&apos;s Firebase ID token. The backend checks that
                identity against its active admin role before allowing any queue
                read or action.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold">Dashboard and backend</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                This dashboard is the operator interface. The backend remains
                the source of truth for review decisions, verification status,
                trust score, and tier.
              </p>
            </div>
          </section>
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

type QueueSelection =
  | { id: string; kind: 'identity'; submittedAt: string }
  | { id: string; kind: 'host'; submittedAt: string }
  | { id: string; kind: 'report'; submittedAt: string };

function ReviewWorkspace({
  approvals,
  reports,
  reviewingUserId,
  reviews,
  selfieUrls,
  updatingHostId,
  updatingReportId,
  viewingUserId,
  onUpdateHost,
  onUpdateReport,
  onUpdateReview,
  onViewSelfie,
}: {
  approvals: HostApproval[];
  reports: AdminReport[];
  reviewingUserId?: string;
  reviews: VerificationReview[];
  selfieUrls: Record<string, string>;
  updatingHostId?: string;
  updatingReportId?: string;
  viewingUserId?: string;
  onUpdateHost: (
    approval: HostApproval,
    status: 'APPROVED' | 'REJECTED',
  ) => Promise<void>;
  onUpdateReport: (
    report: AdminReport,
    status: 'DISMISSED' | 'RESOLVED' | 'REVIEWING',
    confirmed: boolean,
  ) => Promise<void>;
  onUpdateReview: (
    review: VerificationReview,
    status: Exclude<ReviewStatus, 'PENDING'>,
    reason?: string,
  ) => Promise<void>;
  onViewSelfie: (review: VerificationReview) => Promise<void>;
}) {
  const [filter, setFilter] = useState<'all' | 'host' | 'identity' | 'report'>(
    'all',
  );
  const [selected, setSelected] = useState<QueueSelection>();
  const [reason, setReason] = useState('');

  const queue = useMemo<QueueSelection[]>(() => {
    const identityItems = reviews
      .filter((review) => review.status !== 'APPROVED')
      .map((review) => ({
        id: review.id,
        kind: 'identity' as const,
        submittedAt: review.createdAt,
      }));
    const hostItems = approvals.map((approval) => ({
      id: approval.id,
      kind: 'host' as const,
      submittedAt: approval.requestedAt ?? new Date(0).toISOString(),
    }));
    const reportItems = reports.map((report) => ({
      id: report.id,
      kind: 'report' as const,
      submittedAt: report.createdAt,
    }));
    const items =
      filter === 'identity'
        ? identityItems
        : filter === 'host'
          ? hostItems
          : filter === 'report'
            ? reportItems
            : [...identityItems, ...hostItems, ...reportItems];
    return items.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [approvals, filter, reports, reviews]);

  const activeSelection =
    selected && queue.some((item) => item.id === selected.id)
      ? selected
      : queue[0];

  const selectedReview =
    activeSelection?.kind === 'identity'
      ? reviews.find((item) => item.id === activeSelection.id)
      : undefined;
  const selectedHost =
    activeSelection?.kind === 'host'
      ? approvals.find((item) => item.id === activeSelection.id)
      : undefined;
  const selectedReport =
    activeSelection?.kind === 'report'
      ? reports.find((item) => item.id === activeSelection.id)
      : undefined;
  const total =
    reviews.filter((item) => item.status !== 'APPROVED').length +
    approvals.length +
    reports.length;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#d9dfe5] bg-white shadow-[0_22px_70px_rgba(15,42,69,0.09)]"
      id="review-queue"
    >
      <div className="flex flex-wrap gap-3 border-b border-[#dfe4e8] px-5 py-5">
        {(
          [
            ['all', 'All', total],
            [
              'identity',
              'Identity',
              reviews.filter((item) => item.status !== 'APPROVED').length,
            ],
            ['host', 'Host access', approvals.length],
            ['report', 'Reports', reports.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${filter === value ? 'border-[#0d3157] bg-[#0d3157] text-white' : 'border-[#d8dde2] bg-white text-[#17345b] hover:bg-[#f4f7f6]'}`}
            key={value}
            onClick={() => {
              setFilter(value);
              setSelected(undefined);
              setReason('');
            }}
            type="button"
          >
            {label} <span className="ml-1 opacity-70">{count}</span>
          </button>
        ))}
      </div>

      <div className="grid min-h-[42rem] lg:grid-cols-[minmax(25rem,0.95fr)_minmax(28rem,1.1fr)]">
        <div className="border-r border-[#dfe4e8]">
          <div className="grid grid-cols-[1fr_7rem] border-b border-[#e6e9ec] px-6 py-3 text-xs font-black uppercase tracking-[0.08em] text-[#68778a]">
            <span>Item</span>
            <span>Submitted</span>
          </div>
          {queue.length ? (
            queue.map((item) => {
              const review =
                item.kind === 'identity'
                  ? reviews.find((entry) => entry.id === item.id)
                  : undefined;
              const host =
                item.kind === 'host'
                  ? approvals.find((entry) => entry.id === item.id)
                  : undefined;
              const report =
                item.kind === 'report'
                  ? reports.find((entry) => entry.id === item.id)
                  : undefined;
              const title =
                review?.user.displayName ??
                host?.user.displayName ??
                (report
                  ? `Report about ${report.event?.title ?? report.circle?.title ?? report.reportedUser?.displayName ?? 'a member'}`
                  : 'Queue item');
              const subtitle =
                review?.user.profile?.city ??
                host?.user.profile?.city ??
                report?.reason.replaceAll('_', ' ') ??
                'Niva review';
              const photo = review?.user.profile?.profilePhotoUrl;
              return (
                <button
                  className={`grid w-full grid-cols-[1fr_7rem] items-center border-b border-[#e6e9ec] px-6 py-5 text-left transition ${activeSelection?.id === item.id ? 'border-l-4 border-l-[#15528a] bg-[#eef5fa]' : 'border-l-4 border-l-transparent hover:bg-[#fafbf9]'}`}
                  key={`${item.kind}-${item.id}`}
                  onClick={() => {
                    setSelected(item);
                    setReason(review?.reason ?? '');
                  }}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {photo ? (
                      <img
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                        src={photo}
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf1f5] text-sm font-black text-[#17345b]">
                        {item.kind === 'identity'
                          ? 'ID'
                          : item.kind === 'host'
                            ? 'H'
                            : 'R'}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-black text-[#132b4d]">
                        {title}
                      </span>
                      <span className="mt-1 block truncate text-xs capitalize text-[#62728a]">
                        {item.kind} · {subtitle}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs leading-5 text-[#52647b]">
                    {formatQueueDate(item.submittedAt)}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-6 py-16 text-center text-sm text-[#68778a]">
              Nothing needs a decision in this queue.
            </p>
          )}
        </div>

        <div className="min-w-0 bg-[#fdfcf9] p-6 md:p-8">
          {selectedReview ? (
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-[#17345b]">
                    Identity review
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-[#e6eee8] px-3 py-1 text-xs font-bold text-[#315c49]">
                    Pending decision
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 border-b border-[#dfe4e8] pb-6">
                {selectedReview.user.profile?.profilePhotoUrl ? (
                  <img
                    alt={`${selectedReview.user.displayName ?? 'Member'} profile`}
                    className="h-20 w-20 rounded-full object-cover"
                    src={selectedReview.user.profile.profilePhotoUrl}
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e7edf2] text-xl font-black text-[#17345b]">
                    {initials(selectedReview.user.displayName)}
                  </span>
                )}
                <div>
                  <h2 className="text-2xl font-black text-[#132b4d]">
                    {selectedReview.user.displayName ?? 'Niva member'}
                  </h2>
                  <p className="mt-1 text-sm text-[#62728a]">
                    @{selectedReview.user.username ?? 'pending'} ·{' '}
                    {selectedReview.user.profile?.city ?? 'City not set'}
                  </p>
                  <p className="mt-2 text-xs text-[#62728a]">
                    Submitted {formatQueueDate(selectedReview.createdAt)}
                  </p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <PhotoEvidence
                  label="Public profile photo"
                  src={selectedReview.user.profile?.profilePhotoUrl}
                />
                <div>
                  <p className="mb-2 text-sm font-black text-[#17345b]">
                    Private verification selfie
                  </p>
                  {selfieUrls[selectedReview.userId] ? (
                    <img
                      alt="Private verification selfie"
                      className="aspect-[4/3] w-full rounded-2xl border border-[#d8dde2] object-cover"
                      src={selfieUrls[selectedReview.userId]}
                    />
                  ) : (
                    <button
                      className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-[#aeb9c4] bg-white text-sm font-black text-[#15528a] disabled:opacity-60"
                      disabled={
                        !selectedReview.selfieStoragePath ||
                        viewingUserId === selectedReview.userId
                      }
                      onClick={() => void onViewSelfie(selectedReview)}
                      type="button"
                    >
                      {viewingUserId === selectedReview.userId
                        ? 'Loading private selfie…'
                        : 'Securely load private selfie'}
                    </button>
                  )}
                  <p className="mt-2 text-xs leading-5 text-[#62728a]">
                    Only the review team can see this. It never appears on the
                    member&apos;s profile.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 border-t border-[#dfe4e8] pt-5">
                <p className="text-sm font-black text-[#17345b]">Decision</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    className="min-h-12 rounded-xl bg-[#2d744c] px-4 font-black text-white disabled:opacity-50"
                    disabled={reviewingUserId === selectedReview.userId}
                    onClick={() =>
                      void onUpdateReview(selectedReview, 'APPROVED', reason)
                    }
                    type="button"
                  >
                    Approve identity
                  </button>
                  <button
                    className="min-h-12 rounded-xl border border-[#ef5b35] px-4 font-black text-[#d94a26] disabled:opacity-50"
                    disabled={
                      !reason.trim() ||
                      reviewingUserId === selectedReview.userId
                    }
                    onClick={() =>
                      void onUpdateReview(
                        selectedReview,
                        'NEEDS_REVIEW',
                        reason,
                      )
                    }
                    type="button"
                  >
                    Needs another photo
                  </button>
                </div>
                <label className="grid gap-2 text-xs font-black text-[#52647b]">
                  Required when requesting another photo
                  <textarea
                    className="min-h-24 rounded-xl border border-[#d8dde2] bg-white p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#83b5a0]"
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain clearly what the member should change"
                    value={reason}
                  />
                </label>
                <p className="text-xs leading-5 text-[#52705f]">
                  Every decision is recorded with the administrator and time.
                </p>
              </div>
            </div>
          ) : selectedHost ? (
            <DecisionPanel
              eyebrow="Host access"
              title={selectedHost.user.displayName ?? 'Niva member'}
              subtitle={`@${selectedHost.user.username ?? 'pending'} · ${selectedHost.user.profile?.city ?? 'City not set'}`}
              description={`Interests: ${selectedHost.user.profile?.interests.join(', ') || 'Not provided'}`}
              busy={updatingHostId === selectedHost.userId}
              primaryLabel="Approve host access"
              secondaryLabel="Decline request"
              onPrimary={() => void onUpdateHost(selectedHost, 'APPROVED')}
              onSecondary={() => void onUpdateHost(selectedHost, 'REJECTED')}
            />
          ) : selectedReport ? (
            <DecisionPanel
              eyebrow="Safety report"
              title={`Report about ${selectedReport.event?.title ?? selectedReport.circle?.title ?? selectedReport.reportedUser?.displayName ?? 'a member'}`}
              subtitle={`${selectedReport.reason.replaceAll('_', ' ')} · reported by ${selectedReport.reporter.displayName ?? selectedReport.reporter.username ?? 'member'}`}
              description={
                selectedReport.details || 'No additional details were provided.'
              }
              busy={updatingReportId === selectedReport.id}
              primaryLabel="Resolve and confirm"
              secondaryLabel="Dismiss report"
              tertiaryLabel="Mark reviewing"
              onPrimary={() =>
                void onUpdateReport(selectedReport, 'RESOLVED', true)
              }
              onSecondary={() =>
                void onUpdateReport(selectedReport, 'DISMISSED', false)
              }
              onTertiary={() =>
                void onUpdateReport(selectedReport, 'REVIEWING', false)
              }
            />
          ) : (
            <div className="flex min-h-[30rem] items-center justify-center text-sm text-[#68778a]">
              Select an item to review.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PhotoEvidence({ label, src }: { label: string; src?: string | null }) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-[#17345b]">{label}</p>
      {src ? (
        <img
          alt={label}
          className="aspect-[4/3] w-full rounded-2xl border border-[#d8dde2] object-cover"
          src={src}
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[#aeb9c4] bg-white text-sm text-[#68778a]">
          No profile photo submitted
        </div>
      )}
    </div>
  );
}

function DecisionPanel({
  eyebrow,
  title,
  subtitle,
  description,
  busy,
  primaryLabel,
  secondaryLabel,
  tertiaryLabel,
  onPrimary,
  onSecondary,
  onTertiary,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  busy: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel?: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onTertiary?: () => void;
}) {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black text-[#4f846f]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black text-[#132b4d]">{title}</h2>
        <p className="mt-2 text-sm text-[#62728a]">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-[#dfe4e8] bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#68778a]">
          Submitted context
        </p>
        <p className="mt-3 leading-7 text-[#263a54]">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="min-h-12 rounded-xl bg-[#2d744c] px-4 font-black text-white disabled:opacity-50"
          disabled={busy}
          onClick={onPrimary}
          type="button"
        >
          {primaryLabel}
        </button>
        <button
          className="min-h-12 rounded-xl border border-[#d2684b] px-4 font-black text-[#b24e34] disabled:opacity-50"
          disabled={busy}
          onClick={onSecondary}
          type="button"
        >
          {secondaryLabel}
        </button>
        {tertiaryLabel && onTertiary ? (
          <button
            className="min-h-12 rounded-xl border border-[#8da2b7] px-4 font-black text-[#17345b] disabled:opacity-50 sm:col-span-2"
            disabled={busy}
            onClick={onTertiary}
            type="button"
          >
            {tertiaryLabel}
          </button>
        ) : null}
      </div>
      <p className="text-xs leading-5 text-[#52705f]">
        This decision is written to Niva&apos;s administrator audit log.
      </p>
    </div>
  );
}

function formatQueueDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function initials(value?: string | null) {
  return (
    value
      ?.split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'N'
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
