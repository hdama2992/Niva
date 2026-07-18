/**
 * Live local acceptance test for Niva's host and participant roles.
 *
 * Requires a running local API, NIVA_BETA_AUTH_ENABLED=true, and
 * NIVA_ADMIN_KEY in the environment. The created plan is intentionally kept
 * so it can be inspected in the mobile and admin UIs after the test.
 */

const apiUrl = process.env.NIVA_TEST_API_URL ?? 'http://localhost:3001';
const adminKey = process.env.NIVA_ADMIN_KEY;

if (!adminKey) {
  throw new Error('NIVA_ADMIN_KEY is required for the role-flow test.');
}

async function request(
  path,
  { token, admin = false, method = 'GET', body } = {},
) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(admin ? { 'x-niva-admin-key': adminKey } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${text}`);
  }
  return payload;
}

function assert(condition, message) {
  if (!condition) throw new Error(`Acceptance check failed: ${message}`);
}

async function prepareVerifiedMember({ phone, username, displayName, bio }) {
  const token = `niva-beta:${phone}`;
  const session = await request('/auth/session', {
    method: 'POST',
    body: { idToken: token },
  });
  await request('/users/me/username', {
    token,
    method: 'POST',
    body: { username },
  });
  await request('/users/me/profile', {
    token,
    method: 'PUT',
    body: {
      displayName,
      city: 'Bangalore',
      interests: ['Books', 'Coffee', 'Photography'],
      age: 28,
      languages: ['English', 'Hindi'],
      occupation: 'Product designer',
      bio,
      profilePhotoUrl: `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80&niva=${username}`,
    },
  });
  await request('/users/me/self-declaration', {
    token,
    method: 'POST',
    body: { accepted: true, version: 'v1' },
  });
  await request('/users/me/community-guidelines', {
    token,
    method: 'POST',
    body: { accepted: true, version: 'v1' },
  });
  await request('/users/me/selfie', {
    token,
    method: 'POST',
    body: {
      selfieStoragePath: `verification-selfies/beta:${phone}/${Date.now()}.jpg`,
    },
  });
  await request(`/admin/verification-reviews/${session.user.id}`, {
    admin: true,
    method: 'PATCH',
    body: { status: 'APPROVED', reason: 'Local role-flow acceptance test' },
  });
  const verified = await request('/users/me', { token });
  assert(
    verified.user.trust?.verificationStatus === 'VERIFIED',
    `${displayName} should be verified`,
  );
  return { token, user: verified.user };
}

const unique = String(Date.now()).slice(-8);
const host = await prepareVerifiedMember({
  phone: `+9194${unique}`,
  username: `host${unique}`,
  displayName: 'Niva Test Host',
  bio: 'I host thoughtful, low-pressure gatherings and make introductions easy.',
});
const participant = await prepareVerifiedMember({
  phone: `+9195${unique}`,
  username: `guest${unique}`,
  displayName: 'Niva Test Participant',
  bio: 'I enjoy books, photography, and meeting people through shared plans.',
});

await request('/community/host-approval/request', {
  token: host.token,
  method: 'POST',
});
await request(`/admin/host-approvals/${host.user.id}`, {
  admin: true,
  method: 'PATCH',
  body: { status: 'APPROVED', reason: 'Local role-flow acceptance test' },
});

const startsAt = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
startsAt.setHours(11, 0, 0, 0);
const created = await request('/community/events', {
  token: host.token,
  method: 'POST',
  body: {
    title: `Acceptance Coffee & Photo Walk ${unique}`,
    description:
      'A relaxed coffee followed by a short neighbourhood photo walk.',
    hostNote:
      'I will introduce everyone, share the route, and keep the pace comfortable.',
    city: 'Bangalore',
    locationName: 'Indiranagar, Bengaluru',
    startsAt: startsAt.toISOString(),
    capacity: 6,
    difficulty: 'SOCIAL',
    interests: ['Coffee', 'Photography'],
  },
});
const eventId = created.event.id;
assert(
  created.event.hostId === host.user.id,
  'created event should belong to the host',
);

const beforeJoin = await request('/community/events?city=Bangalore', {
  token: participant.token,
});
assert(
  beforeJoin.events.some((event) => event.id === eventId),
  'participant should discover the event',
);

const join = await request(`/community/events/${eventId}/join`, {
  token: participant.token,
  method: 'POST',
});
assert(
  join.membership.status === 'REQUESTED',
  'join should begin as a request',
);

const hostQueue = await request(`/community/events/${eventId}/members`, {
  token: host.token,
});
const pending = hostQueue.members.find(
  (member) => member.userId === participant.user.id,
);
assert(
  pending?.status === 'REQUESTED',
  'host should see the pending participant',
);
assert(
  pending?.user.profile?.bio,
  'host review should include the participant profile context',
);

let participantCouldApprove = false;
try {
  await request(`/community/events/${eventId}/members/${pending.id}`, {
    token: participant.token,
    method: 'PATCH',
    body: { status: 'APPROVED' },
  });
  participantCouldApprove = true;
} catch {
  // Expected: only the host can manage requests.
}
assert(
  !participantCouldApprove,
  'participant must not be able to approve a join request',
);

await request(`/community/events/${eventId}/members/${pending.id}`, {
  token: host.token,
  method: 'PATCH',
  body: { status: 'APPROVED' },
});

const participantPlans = await request('/community/me/activities', {
  token: participant.token,
});
const approvedPlan = participantPlans.events.find(
  (membership) => membership.event?.id === eventId,
);
assert(
  approvedPlan?.status === 'APPROVED',
  'participant should see the approved plan',
);

await request(`/community/chats/EVENT/${eventId}/messages`, {
  token: participant.token,
  method: 'POST',
  body: { body: 'Looking forward to meeting everyone!' },
});
const hostChat = await request(`/community/chats/EVENT/${eventId}/messages`, {
  token: host.token,
});
assert(
  hostChat.messages.some(
    (message) => message.sender.id === participant.user.id,
  ),
  'host should see the approved participant message',
);

console.log(
  JSON.stringify(
    {
      result: 'passed',
      eventId,
      eventTitle: created.event.title,
      hostUserId: host.user.id,
      participantUserId: participant.user.id,
      checks: [
        'host verified and approved',
        'host created event',
        'participant discovered event',
        'participant sent one-time join request',
        'participant could not self-approve',
        'host reviewed profile context and approved request',
        'participant saw approved plan',
        'approved cohort chat worked for both roles',
      ],
    },
    null,
    2,
  ),
);
