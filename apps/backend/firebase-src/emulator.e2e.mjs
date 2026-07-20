import assert from 'node:assert/strict';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GCLOUD_PROJECT || 'niva-staging';
const apiBase = `http://127.0.0.1:5001/${projectId}/asia-south1/api`;
const authBase =
  'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator';
const firestoreBase = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;

if (getApps().length === 0) initializeApp({ projectId });
const db = getFirestore();

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new Error(
      `${options.method ?? 'GET'} ${url}: ${response.status} ${text}`,
    );
  }
  return body;
}

async function signUp(label) {
  const payload = await jsonRequest(authBase, {
    body: JSON.stringify({
      email: `${label}@niva.test`,
      password: 'Emulator-only-password-123',
      returnSecureToken: true,
    }),
    method: 'POST',
  });
  await jsonRequest(`${apiBase}/auth/session`, {
    body: JSON.stringify({ idToken: payload.idToken }),
    method: 'POST',
  });
  return { idToken: payload.idToken, uid: payload.localId };
}

async function api(path, token, options = {}) {
  return jsonRequest(`${apiBase}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
}

async function completeProfile(account, displayName) {
  await api('/users/me/username', account.idToken, {
    body: JSON.stringify({ username: displayName.toLowerCase() }),
    method: 'POST',
  });
  await api('/users/me/profile', account.idToken, {
    body: JSON.stringify({
      age: 28,
      bio: 'A real emulator profile used to validate the Niva flow.',
      city: 'Bangalore',
      displayName,
      interests: ['Books', 'Coffee', 'Photography'],
      languages: ['English'],
      occupation: 'Designer',
      profilePhotoUrl: `https://example.com/${displayName}.jpg`,
    }),
    method: 'PUT',
  });
  await api('/users/me/self-declaration', account.idToken, {
    body: JSON.stringify({ accepted: true, version: 'v1' }),
    method: 'POST',
  });
  await api('/users/me/community-guidelines', account.idToken, {
    body: JSON.stringify({ accepted: true, version: 'v1' }),
    method: 'POST',
  });
  await db.collection('users').doc(account.uid).update({
    'selfieVerification.status': 'APPROVED',
    'trust.tier': 'BASIC_VERIFIED',
    'trust.verificationStatus': 'VERIFIED',
  });
}

const health = await jsonRequest(`${apiBase}/health`);
assert.equal(health.status, 'ok');

const host = await signUp('host');
const member = await signUp('member');
await completeProfile(host, 'Host');
await completeProfile(member, 'Member');
await db.collection('hostApprovals').doc(host.uid).set({
  status: 'APPROVED',
  userId: host.uid,
});

const startsAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
const created = await api('/community/events', host.idToken, {
  body: JSON.stringify({
    capacity: 6,
    city: 'Bangalore',
    description: 'A full participant and host integration test.',
    difficulty: 'SOCIAL',
    interests: ['Books', 'Coffee'],
    locationName: 'Niva Test Cafe',
    startsAt,
    title: 'Firebase Emulator Meetup',
  }),
  method: 'POST',
});
assert.equal(created.event.title, 'Firebase Emulator Meetup');
const eventId = created.event.id;

const joined = await api(`/community/events/${eventId}/join`, member.idToken, {
  method: 'POST',
});
assert.equal(joined.membership.status, 'REQUESTED');

const members = await api(`/community/events/${eventId}/members`, host.idToken);
assert.equal(members.members.length, 1);
const membershipId = members.members[0].id;

const approved = await api(
  `/community/events/${eventId}/members/${membershipId}`,
  host.idToken,
  { body: JSON.stringify({ status: 'APPROVED' }), method: 'PATCH' },
);
assert.equal(approved.membership.status, 'APPROVED');

const sent = await api(
  `/community/chats/EVENT/${eventId}/messages`,
  member.idToken,
  {
    body: JSON.stringify({ body: 'Hello from Firestore realtime.' }),
    method: 'POST',
  },
);
assert.equal(sent.message.senderId, member.uid);
const messages = await api(
  `/community/chats/EVENT/${eventId}/messages`,
  member.idToken,
);
assert.equal(messages.messages.length, 1);

const outsider = await signUp('outsider');
const approvedChatRead = await fetch(
  `${firestoreBase}/chatThreads/EVENT_${eventId}/messages/${sent.message.id}`,
  { headers: { Authorization: `Bearer ${member.idToken}` } },
);
assert.equal(approvedChatRead.status, 200);
const outsiderChatRead = await fetch(
  `${firestoreBase}/chatThreads/EVENT_${eventId}/messages/${sent.message.id}`,
  { headers: { Authorization: `Bearer ${outsider.idToken}` } },
);
assert.equal(outsiderChatRead.status, 403);
const directMessageWrite = await fetch(
  `${firestoreBase}/chatThreads/EVENT_${eventId}/messages/forbidden-client-write`,
  {
    body: JSON.stringify({ fields: { body: { stringValue: 'bypass' } } }),
    headers: {
      Authorization: `Bearer ${member.idToken}`,
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
  },
);
assert.equal(directMessageWrite.status, 403);

const attended = await api(
  `/community/events/${eventId}/members/${membershipId}/attendance`,
  host.idToken,
  { body: JSON.stringify({ status: 'ATTENDED' }), method: 'PATCH' },
);
assert.equal(attended.membership.status, 'ATTENDED');

await api(`/community/events/${eventId}/feedback`, member.idToken, {
  body: JSON.stringify({ body: 'Warm and well hosted.', rating: 5 }),
  method: 'POST',
});
const insights = await api(
  `/community/events/${eventId}/feedback-insights`,
  host.idToken,
);
assert.equal(insights.insights.averageRating, 5);

const bootstrapped = await api('/admin/access', host.idToken, {
  body: JSON.stringify({ role: 'SUPER_ADMIN', userId: host.uid }),
  headers: { 'X-Niva-Admin-Key': 'local-emulator-only-not-for-production' },
  method: 'POST',
});
assert.equal(bootstrapped.access.role, 'SUPER_ADMIN');
const admin = await api('/admin/me', host.idToken);
assert.equal(admin.admin.role, 'SUPER_ADMIN');

await api('/community/host-approval/request', member.idToken, {
  method: 'POST',
});
const pendingHosts = await api(
  '/admin/host-approvals?status=PENDING',
  host.idToken,
);
assert.equal(pendingHosts.approvals.length, 1);
await api(`/admin/host-approvals/${member.uid}`, host.idToken, {
  body: JSON.stringify({ status: 'APPROVED' }),
  method: 'PATCH',
});

await api('/community/reports', member.idToken, {
  body: JSON.stringify({
    details: 'Emulator safety workflow test.',
    reason: 'OTHER',
    reportedUserId: host.uid,
  }),
  method: 'POST',
});
const reports = await api('/admin/reports?status=OPEN', host.idToken);
assert.equal(reports.reports.length, 1);
await api(`/admin/reports/${reports.reports[0].id}`, host.idToken, {
  body: JSON.stringify({ confirmed: false, status: 'DISMISSED' }),
  method: 'PATCH',
});

const analytics = await api('/admin/analytics/summary', host.idToken);
assert.equal(analytics.analytics.feedbackSubmitted, 1);
assert.equal(analytics.analytics.membershipApprovals, 1);

console.info(
  'Firebase emulator E2E passed: auth, profiles, host, participant, chat, safety, and admin.',
);
