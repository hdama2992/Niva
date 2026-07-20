import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';
import {
  assertObject,
  createNotification,
  db,
  getRequiredDocument,
  HttpError,
  optionalString,
  publicUser,
  requiredNumber,
  requiredString,
  requiredStringArray,
  SUPPORTED_CITIES,
  Timestamp,
  toJson,
  type ActivityType,
  type AuthenticatedRequest,
  type MembershipStatus,
} from './core';

const ACTIVE_MEMBERSHIP_STATUSES: MembershipStatus[] = [
  'REQUESTED',
  'APPROVED',
  'ATTENDED',
];
const DIFFICULTIES = ['BEGINNER', 'EASY', 'FOCUSED', 'SOCIAL'];

export function activityCollection(type: ActivityType) {
  return type === 'EVENT' ? 'events' : 'circles';
}

export function membershipCollection(type: ActivityType) {
  return type === 'EVENT' ? 'eventMembers' : 'circleMembers';
}

export function activityIdField(type: ActivityType) {
  return type === 'EVENT' ? 'eventId' : 'circleId';
}

export function threadId(type: ActivityType, activityId: string) {
  return `${type}_${activityId}`;
}

export function membershipId(activityId: string, userId: string) {
  return `${activityId}_${userId}`;
}

export async function listActivities(
  request: AuthenticatedRequest,
  type: ActivityType,
  city?: string,
) {
  let query = db
    .collection(activityCollection(type))
    .where('status', '==', 'PUBLISHED');
  if (city) query = query.where('city', '==', city);
  const snapshot = await query.get();
  const blocked = await mutuallyBlockedIds(request.userId);
  const results = await Promise.all(
    snapshot.docs
      .filter((document) => !blocked.has(document.get('hostId') as string))
      .map((document) => hydrateActivity(request.userId, type, document)),
  );
  return results.sort(
    (left, right) =>
      Date.parse(String(left.startsAt)) - Date.parse(String(right.startsAt)),
  );
}

export async function hydrateActivity(
  viewerId: string,
  type: ActivityType,
  snapshot: DocumentSnapshot,
) {
  const data = snapshot.data() ?? {};
  const hostId = data.hostId as string;
  const [host, membership, occurrences] = await Promise.all([
    db.collection('users').doc(hostId).get(),
    db
      .collection(membershipCollection(type))
      .doc(membershipId(snapshot.id, viewerId))
      .get(),
    type === 'CIRCLE'
      ? db
          .collection('circleOccurrences')
          .where('circleId', '==', snapshot.id)
          .get()
      : Promise.resolve(null),
  ]);
  const status = membership.exists
    ? (membership.get('status') as MembershipStatus)
    : undefined;
  const canSeeLocation =
    hostId === viewerId || status === 'APPROVED' || status === 'ATTENDED';

  return toJson({
    ...data,
    _count: { members: data.activeMemberCount ?? 0 },
    category: type === 'EVENT' ? 'event' : 'circle',
    host: publicUser(host.data()),
    id: snapshot.id,
    latitude: canSeeLocation ? (data.latitude ?? null) : null,
    locationName: canSeeLocation ? data.locationName : data.city,
    longitude: canSeeLocation ? (data.longitude ?? null) : null,
    membershipStatus: status,
    ...(occurrences
      ? {
          occurrences: occurrences.docs
            .map((document) => ({
              ...(document.data() as { startsAt: Timestamp }),
              id: document.id,
            }))
            .sort(
              (left, right) =>
                timestampMillis(left.startsAt) -
                timestampMillis(right.startsAt),
            ),
        }
      : {}),
  }) as Record<string, unknown>;
}

export async function createActivity(
  request: AuthenticatedRequest,
  type: ActivityType,
) {
  await assertCanHost(request.userId);
  const body = assertObject(request.body);
  const input = parseActivity(body, type, true);
  const reference = db.collection(activityCollection(type)).doc();
  const now = Timestamp.now();
  await reference.create({
    ...input,
    activeMemberCount: 0,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: now,
    hostId: request.userId,
    id: reference.id,
    requiresVerification: true,
    status: 'PUBLISHED',
    updatedAt: now,
  });
  await db.collection('chatThreads').doc(threadId(type, reference.id)).set({
    activityId: reference.id,
    createdAt: now,
    type,
    updatedAt: now,
  });

  if (type === 'CIRCLE') {
    await replaceOccurrences(
      reference.id,
      input.startsAt as Timestamp,
      input.durationWeeks as number,
      input.recurrenceIntervalWeeks as number,
    );
  }

  return hydrateActivity(request.userId, type, await reference.get());
}

export async function updateActivity(
  request: AuthenticatedRequest,
  type: ActivityType,
  activityId: string,
) {
  const current = await assertHost(request.userId, type, activityId);
  if (!['DRAFT', 'PUBLISHED'].includes(current.get('status') as string)) {
    throw new HttpError(
      409,
      'Cancelled or completed activities cannot change.',
    );
  }
  const body = assertObject(request.body);
  const changes = parseActivity(body, type, false);
  const capacity = changes.capacity as number | undefined;
  if (
    capacity !== undefined &&
    capacity < Number(current.get('activeMemberCount') ?? 0)
  ) {
    throw new HttpError(
      400,
      'Capacity cannot be below the current member count.',
    );
  }

  const startsAt =
    (changes.startsAt as Timestamp | undefined) ??
    (current.get('startsAt') as Timestamp);
  if (type === 'EVENT') {
    validateTimeRange(startsAt, changes.endsAt as Timestamp | null | undefined);
  }
  await current.ref.update({ ...changes, updatedAt: Timestamp.now() });
  await db
    .collection('chatThreads')
    .doc(threadId(type, activityId))
    .set({ updatedAt: Timestamp.now() }, { merge: true });

  if (
    type === 'CIRCLE' &&
    (changes.startsAt ||
      changes.durationWeeks ||
      changes.recurrenceIntervalWeeks)
  ) {
    await replaceOccurrences(
      activityId,
      startsAt,
      (changes.durationWeeks as number | undefined) ??
        (current.get('durationWeeks') as number),
      (changes.recurrenceIntervalWeeks as number | undefined) ??
        (current.get('recurrenceIntervalWeeks') as number),
    );
  }

  await notifyMembers(
    type,
    activityId,
    'Plan updated',
    `${String(changes.title ?? current.get('title'))} has new details.`,
    'ACTIVITY_UPDATED',
  );
  return hydrateActivity(request.userId, type, await current.ref.get());
}

export async function cancelActivity(
  userId: string,
  type: ActivityType,
  activityId: string,
  reasonInput: unknown,
) {
  const activity = await assertHost(userId, type, activityId);
  if (!['DRAFT', 'PUBLISHED'].includes(activity.get('status') as string)) {
    throw new HttpError(409, 'This activity can no longer be cancelled.');
  }
  const reason = typeof reasonInput === 'string' ? reasonInput.trim() : '';
  if (reason.length < 3 || reason.length > 300) {
    throw new HttpError(400, 'Give members a short cancellation reason.');
  }
  await activity.ref.update({
    cancellationReason: reason,
    cancelledAt: Timestamp.now(),
    status: 'CANCELLED',
    updatedAt: Timestamp.now(),
  });
  await db
    .collection('chatThreads')
    .doc(threadId(type, activityId))
    .set({ updatedAt: Timestamp.now() }, { merge: true });
  const title = String(activity.get('title'));
  await notifyMembers(
    type,
    activityId,
    `${title} was cancelled`,
    reason,
    'ACTIVITY_CANCELLED',
  );
  return hydrateActivity(userId, type, await activity.ref.get());
}

export async function joinActivity(
  userId: string,
  type: ActivityType,
  activityId: string,
) {
  const user = await getRequiredDocument('users', userId);
  if (user.get('trust.verificationStatus') !== 'VERIFIED') {
    throw new HttpError(403, 'Complete verification before joining a plan.');
  }
  if (user.get('communityGuidelinesAccepted') !== true) {
    throw new HttpError(403, 'Accept the community guidelines before joining.');
  }

  const activityReference = db
    .collection(activityCollection(type))
    .doc(activityId);
  const membershipReference = db
    .collection(membershipCollection(type))
    .doc(membershipId(activityId, userId));
  await db.runTransaction(async (transaction) => {
    const [activity, existing] = await Promise.all([
      transaction.get(activityReference),
      transaction.get(membershipReference),
    ]);
    if (!activity.exists || activity.get('status') !== 'PUBLISHED') {
      throw new HttpError(404, 'This plan is no longer available.');
    }
    if (activity.get('hostId') === userId) {
      throw new HttpError(400, 'You already host this plan.');
    }
    const priorStatus = existing.get('status') as MembershipStatus | undefined;
    const wasActive =
      priorStatus && ACTIVE_MEMBERSHIP_STATUSES.includes(priorStatus);
    const activeCount = Number(activity.get('activeMemberCount') ?? 0);
    if (!wasActive && activeCount >= Number(activity.get('capacity'))) {
      throw new HttpError(409, 'This plan is full.');
    }
    const now = Timestamp.now();
    transaction.set(
      membershipReference,
      {
        [activityIdField(type)]: activityId,
        createdAt: existing.get('createdAt') ?? now,
        id: membershipReference.id,
        joinedAt: now,
        status: 'REQUESTED',
        updatedAt: now,
        userId,
      },
      { merge: true },
    );
    if (!wasActive) {
      transaction.update(activityReference, {
        activeMemberCount: activeCount + 1,
        updatedAt: now,
      });
    }
  });

  const activity = await activityReference.get();
  await Promise.all([
    createNotification(
      userId,
      'Request received',
      `Your request for ${String(activity.get('title'))} is ready for host review.`,
      { [`${type.toLowerCase()}Id`]: activityId },
      type === 'EVENT' ? 'JOIN_REQUEST_ACCEPTED' : 'CIRCLE_STARTING',
    ),
    createNotification(
      activity.get('hostId') as string,
      'New join request',
      `Someone requested to join ${String(activity.get('title'))}.`,
      { [`${type.toLowerCase()}Id`]: activityId },
      'JOIN_REQUEST_RECEIVED',
    ),
  ]);
  await db
    .collection('chatThreads')
    .doc(threadId(type, activityId))
    .set({ updatedAt: Timestamp.now() }, { merge: true });

  return hydrateMembership(type, await membershipReference.get());
}

export async function leaveActivity(
  userId: string,
  type: ActivityType,
  activityId: string,
) {
  const activityReference = db
    .collection(activityCollection(type))
    .doc(activityId);
  const memberReference = db
    .collection(membershipCollection(type))
    .doc(membershipId(activityId, userId));
  await db.runTransaction(async (transaction) => {
    const [activity, membership] = await Promise.all([
      transaction.get(activityReference),
      transaction.get(memberReference),
    ]);
    if (!membership.exists) return;
    const status = membership.get('status') as MembershipStatus;
    transaction.update(memberReference, {
      status: 'CANCELLED',
      updatedAt: Timestamp.now(),
    });
    if (activity.exists && ACTIVE_MEMBERSHIP_STATUSES.includes(status)) {
      transaction.update(activityReference, {
        activeMemberCount: Math.max(
          0,
          Number(activity.get('activeMemberCount') ?? 0) - 1,
        ),
        updatedAt: Timestamp.now(),
      });
    }
  });
  await db
    .collection('chatThreads')
    .doc(threadId(type, activityId))
    .set({ updatedAt: Timestamp.now() }, { merge: true });
  return { left: true };
}

export async function listMembers(
  hostId: string,
  type: ActivityType,
  activityId: string,
) {
  await assertHost(hostId, type, activityId);
  const snapshot = await db
    .collection(membershipCollection(type))
    .where(activityIdField(type), '==', activityId)
    .get();
  return Promise.all(
    snapshot.docs.map(async (membership) => {
      const user = await db
        .collection('users')
        .doc(membership.get('userId'))
        .get();
      return toJson({
        ...membership.data(),
        id: membership.id,
        user: publicUser(user.data()),
      });
    }),
  );
}

export async function updateMembership(
  hostId: string,
  type: ActivityType,
  activityId: string,
  memberId: string,
  status: MembershipStatus,
  attendance = false,
) {
  const allowed = attendance
    ? ['ATTENDED', 'NO_SHOW']
    : ['APPROVED', 'CANCELLED'];
  if (!allowed.includes(status))
    throw new HttpError(400, 'Invalid member status.');
  const activity = await assertHost(hostId, type, activityId);
  const memberReference = db
    .collection(membershipCollection(type))
    .doc(memberId);
  const member = await memberReference.get();
  if (!member.exists || member.get(activityIdField(type)) !== activityId) {
    throw new HttpError(404, 'Membership was not found.');
  }
  const previous = member.get('status') as MembershipStatus;
  await db.runTransaction(async (transaction) => {
    const latestActivity = await transaction.get(activity.ref);
    const wasActive = ACTIVE_MEMBERSHIP_STATUSES.includes(previous);
    const becomesActive = ACTIVE_MEMBERSHIP_STATUSES.includes(status);
    let count = Number(latestActivity.get('activeMemberCount') ?? 0);
    if (wasActive && !becomesActive) count -= 1;
    if (!wasActive && becomesActive) {
      if (count >= Number(latestActivity.get('capacity'))) {
        throw new HttpError(409, 'This plan is full.');
      }
      count += 1;
    }
    transaction.update(memberReference, { status, updatedAt: Timestamp.now() });
    transaction.update(activity.ref, {
      activeMemberCount: Math.max(0, count),
      updatedAt: Timestamp.now(),
    });
  });

  const userId = member.get('userId') as string;
  await createNotification(
    userId,
    attendance ? 'Attendance updated' : 'Join request updated',
    attendance
      ? `Your attendance for ${String(activity.get('title'))} was marked ${status.toLowerCase().replace('_', ' ')}.`
      : status === 'APPROVED'
        ? `You can now join ${String(activity.get('title'))}.`
        : `Your request for ${String(activity.get('title'))} was not approved.`,
    { [`${type.toLowerCase()}Id`]: activityId },
    attendance ? 'ATTENDANCE_UPDATED' : 'JOIN_REQUEST_ACCEPTED',
  );
  await db
    .collection('chatThreads')
    .doc(threadId(type, activityId))
    .set({ updatedAt: Timestamp.now() }, { merge: true });
  return hydrateMembership(type, await memberReference.get());
}

export async function hydrateMembership(
  type: ActivityType,
  snapshot: DocumentSnapshot,
) {
  const activityId = snapshot.get(activityIdField(type)) as string;
  const activity = await getRequiredDocument(
    activityCollection(type),
    activityId,
  );
  return toJson({
    ...snapshot.data(),
    [type === 'EVENT' ? 'event' : 'circle']: await hydrateActivity(
      snapshot.get('userId') as string,
      type,
      activity,
    ),
    id: snapshot.id,
  });
}

export async function listMyActivities(userId: string) {
  const [eventMemberships, circleMemberships, hostedEvents, hostedCircles] =
    await Promise.all([
      db.collection('eventMembers').where('userId', '==', userId).get(),
      db.collection('circleMembers').where('userId', '==', userId).get(),
      db.collection('events').where('hostId', '==', userId).get(),
      db.collection('circles').where('hostId', '==', userId).get(),
    ]);
  return {
    circles: await Promise.all(
      circleMemberships.docs.map((document) =>
        hydrateMembership('CIRCLE', document),
      ),
    ),
    events: await Promise.all(
      eventMemberships.docs.map((document) =>
        hydrateMembership('EVENT', document),
      ),
    ),
    hostedCircles: await Promise.all(
      hostedCircles.docs.map((document) =>
        hydrateActivity(userId, 'CIRCLE', document),
      ),
    ),
    hostedEvents: await Promise.all(
      hostedEvents.docs.map((document) =>
        hydrateActivity(userId, 'EVENT', document),
      ),
    ),
  };
}

export async function assertChatAccess(
  userId: string,
  type: ActivityType,
  activityId: string,
) {
  const activity = await getRequiredDocument(
    activityCollection(type),
    activityId,
  );
  if (activity.get('hostId') === userId) return activity;
  const membership = await db
    .collection(membershipCollection(type))
    .doc(membershipId(activityId, userId))
    .get();
  if (!['APPROVED', 'ATTENDED'].includes(membership.get('status') as string)) {
    throw new HttpError(403, 'Chat opens after your membership is approved.');
  }
  return activity;
}

export async function assertHost(
  userId: string,
  type: ActivityType,
  activityId: string,
) {
  const activity = await getRequiredDocument(
    activityCollection(type),
    activityId,
  );
  if (activity.get('hostId') !== userId) {
    throw new HttpError(403, 'Only the host can manage this plan.');
  }
  return activity;
}

export async function assertCanHost(userId: string) {
  const [approval, admin] = await Promise.all([
    db.collection('hostApprovals').doc(userId).get(),
    db.collection('adminAccess').doc(userId).get(),
  ]);
  if (
    approval.get('status') !== 'APPROVED' &&
    !['COMMUNITY_MANAGER', 'SUPER_ADMIN'].includes(admin.get('role') as string)
  ) {
    throw new HttpError(403, 'Host access requires approval from Niva.');
  }
}

export async function notifyMembers(
  type: ActivityType,
  activityId: string,
  title: string,
  body: string,
  notificationType: string,
) {
  const members = await db
    .collection(membershipCollection(type))
    .where(activityIdField(type), '==', activityId)
    .get();
  await Promise.all(
    members.docs
      .filter((member) =>
        ACTIVE_MEMBERSHIP_STATUSES.includes(member.get('status')),
      )
      .map((member) =>
        createNotification(
          member.get('userId'),
          title,
          body,
          { [`${type.toLowerCase()}Id`]: activityId },
          notificationType,
        ),
      ),
  );
}

function parseActivity(
  body: Record<string, unknown>,
  type: ActivityType,
  required: boolean,
) {
  const output: DocumentData = {};
  const stringFields: Array<[string, number]> = [
    ['title', 120],
    ['description', 1000],
    ['city', 80],
    ['locationName', 140],
  ];
  if (type === 'CIRCLE') {
    stringFields.push(['schedule', 120], ['timezone', 80]);
  }
  for (const [field, max] of stringFields) {
    if (required || body[field] !== undefined) {
      output[field] = requiredString(body, field, max);
    }
  }
  if (output.city && !SUPPORTED_CITIES.includes(output.city)) {
    throw new HttpError(400, 'This city is not supported yet.');
  }
  if (required || body.capacity !== undefined) {
    output.capacity = requiredNumber(body, 'capacity', 2, 100);
    if (type === 'CIRCLE' && output.capacity > 16) {
      throw new HttpError(400, 'Circle capacity cannot exceed 16.');
    }
  }
  if (required || body.interests !== undefined) {
    output.interests = requiredStringArray(body, 'interests', 1, 10);
  }
  if (required || body.difficulty !== undefined) {
    const difficulty = requiredString(body, 'difficulty', 20);
    if (!DIFFICULTIES.includes(difficulty)) {
      throw new HttpError(400, 'Choose a supported difficulty.');
    }
    output.difficulty = difficulty;
  }
  for (const field of ['coverImageUrl', 'hostNote'] as const) {
    if (body[field] !== undefined) {
      output[field] = optionalString(
        body,
        field,
        field === 'hostNote' ? 400 : 2048,
      );
    }
  }
  for (const [field, min, max] of [
    ['latitude', -90, 90],
    ['longitude', -180, 180],
  ] as const) {
    if (body[field] !== undefined) {
      output[field] = requiredNumber(body, field, min, max);
    }
  }
  if (required || body.startsAt !== undefined) {
    output.startsAt = parseDate(body.startsAt, 'startsAt', true);
  }
  if (body.endsAt !== undefined) {
    output.endsAt = parseDate(body.endsAt, 'endsAt', false);
  }
  if (type === 'EVENT' && output.startsAt) {
    validateTimeRange(output.startsAt, output.endsAt);
  }
  if (type === 'CIRCLE') {
    if (required || body.durationWeeks !== undefined) {
      output.durationWeeks = requiredNumber(body, 'durationWeeks', 2, 16);
    }
    if (required || body.recurrenceIntervalWeeks !== undefined) {
      const interval = requiredNumber(body, 'recurrenceIntervalWeeks', 1, 2);
      if (![1, 2].includes(interval)) {
        throw new HttpError(400, 'Circles may repeat weekly or fortnightly.');
      }
      output.recurrenceIntervalWeeks = interval;
    }
  }
  return output;
}

function parseDate(value: unknown, field: string, mustBeFuture: boolean) {
  if (typeof value !== 'string')
    throw new HttpError(400, `${field} is invalid.`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new HttpError(400, `${field} is invalid.`);
  if (mustBeFuture && date.getTime() <= Date.now()) {
    throw new HttpError(400, `${field} must be in the future.`);
  }
  return Timestamp.fromDate(date);
}

function validateTimeRange(startsAt: Timestamp, endsAt?: Timestamp | null) {
  if (endsAt && endsAt.toMillis() <= startsAt.toMillis()) {
    throw new HttpError(400, 'The end time must be after the start time.');
  }
}

async function replaceOccurrences(
  circleId: string,
  startsAt: Timestamp,
  durationWeeks: number,
  intervalWeeks: number,
) {
  const existing = await db
    .collection('circleOccurrences')
    .where('circleId', '==', circleId)
    .get();
  const deleteBatch = db.batch();
  existing.docs.forEach((document) => deleteBatch.delete(document.ref));
  if (!existing.empty) await deleteBatch.commit();

  const batch = db.batch();
  const sessions = Math.floor((durationWeeks - 1) / intervalWeeks) + 1;
  for (let index = 0; index < sessions; index += 1) {
    const reference = db.collection('circleOccurrences').doc();
    const date = new Date(
      startsAt.toMillis() + index * intervalWeeks * 7 * 24 * 60 * 60 * 1000,
    );
    batch.set(reference, {
      cancellationReason: null,
      circleId,
      createdAt: Timestamp.now(),
      id: reference.id,
      startsAt: Timestamp.fromDate(date),
      status: 'SCHEDULED',
    });
  }
  await batch.commit();
}

async function mutuallyBlockedIds(userId: string) {
  const [made, received] = await Promise.all([
    db.collection('blocks').where('blockerId', '==', userId).get(),
    db.collection('blocks').where('blockedId', '==', userId).get(),
  ]);
  return new Set([
    ...made.docs.map((document) => document.get('blockedId') as string),
    ...received.docs.map((document) => document.get('blockerId') as string),
  ]);
}

function timestampMillis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}
