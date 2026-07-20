import { Router } from 'express';
import {
  activityIdField,
  assertChatAccess,
  assertHost,
  cancelActivity,
  createActivity,
  joinActivity,
  leaveActivity,
  listActivities,
  listMembers,
  listMyActivities,
  membershipCollection,
  threadId,
  updateActivity,
  updateMembership,
} from './activities';
import {
  asAuthed,
  assertObject,
  asyncRoute,
  db,
  defaultSettings,
  documentToJson,
  getRequiredDocument,
  HttpError,
  optionalString,
  publicUser,
  requiredBoolean,
  requiredNumber,
  requiredString,
  Timestamp,
  toJson,
  type ActivityType,
  type MembershipStatus,
} from './core';

export const communityRouter = Router();

communityRouter.get(
  '/events',
  asyncRoute(async (request, response) => {
    response.json({
      events: await listActivities(
        asAuthed(request),
        'EVENT',
        stringQuery(request.query.city),
      ),
    });
  }),
);

communityRouter.post(
  '/events',
  asyncRoute(async (request, response) => {
    response.status(201).json({
      event: await createActivity(asAuthed(request), 'EVENT'),
    });
  }),
);

communityRouter.patch(
  '/events/:eventId',
  asyncRoute(async (request, response) => {
    response.json({
      event: await updateActivity(
        asAuthed(request),
        'EVENT',
        request.params.eventId,
      ),
    });
  }),
);

communityRouter.post(
  '/events/:eventId/cancel',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    response.json({
      event: await cancelActivity(
        asAuthed(request).userId,
        'EVENT',
        request.params.eventId,
        body.reason,
      ),
    });
  }),
);

communityRouter.post(
  '/events/:eventId/join',
  asyncRoute(async (request, response) => {
    response.json({
      membership: await joinActivity(
        asAuthed(request).userId,
        'EVENT',
        request.params.eventId,
      ),
    });
  }),
);

communityRouter.post(
  '/events/:eventId/leave',
  asyncRoute(async (request, response) => {
    response.json(
      await leaveActivity(
        asAuthed(request).userId,
        'EVENT',
        request.params.eventId,
      ),
    );
  }),
);

communityRouter.get(
  '/events/:eventId/members',
  asyncRoute(async (request, response) => {
    response.json({
      members: await listMembers(
        asAuthed(request).userId,
        'EVENT',
        request.params.eventId,
      ),
    });
  }),
);

communityRouter.patch(
  '/events/:eventId/members/:memberId/attendance',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    response.json({
      membership: await updateMembership(
        asAuthed(request).userId,
        'EVENT',
        request.params.eventId,
        request.params.memberId,
        requiredMembershipStatus(body.status),
        true,
      ),
    });
  }),
);

communityRouter.patch(
  '/events/:eventId/members/:memberId',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    response.json({
      membership: await updateMembership(
        asAuthed(request).userId,
        'EVENT',
        request.params.eventId,
        request.params.memberId,
        requiredMembershipStatus(body.status),
      ),
    });
  }),
);

communityRouter.post(
  '/events/:eventId/feedback',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const eventId = request.params.eventId;
    const userId = asAuthed(request).userId;
    const membership = await db
      .collection('eventMembers')
      .doc(`${eventId}_${userId}`)
      .get();
    if (membership.get('status') !== 'ATTENDED') {
      throw new HttpError(403, 'Feedback opens after attendance is confirmed.');
    }
    const reference = db.collection('feedback').doc(`${eventId}_${userId}`);
    await reference.set({
      body: optionalString(body, 'body', 1000),
      createdAt: Timestamp.now(),
      eventId,
      id: reference.id,
      rating: requiredNumber(body, 'rating', 1, 5),
      updatedAt: Timestamp.now(),
      userId,
    });
    response.json({ feedback: documentToJson(await reference.get()) });
  }),
);

communityRouter.patch(
  '/events/:eventId/continuity-preference',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const eventId = request.params.eventId;
    const userId = asAuthed(request).userId;
    const reference = db
      .collection('continuityPreferences')
      .doc(`${eventId}_${userId}`);
    await reference.set(
      {
        eventId,
        id: reference.id,
        updatedAt: Timestamp.now(),
        userId,
        wantsCircleSuggestions: requiredBoolean(body, 'wantsCircleSuggestions'),
        wantsSimilarEvents: requiredBoolean(body, 'wantsSimilarEvents'),
      },
      { merge: true },
    );
    response.json({ preference: documentToJson(await reference.get()) });
  }),
);

communityRouter.get(
  '/events/:eventId/feedback-insights',
  asyncRoute(async (request, response) => {
    await assertHost(asAuthed(request).userId, 'EVENT', request.params.eventId);
    const snapshot = await db
      .collection('feedback')
      .where('eventId', '==', request.params.eventId)
      .get();
    const ratings = snapshot.docs.map((document) =>
      Number(document.get('rating')),
    );
    response.json({
      insights: {
        averageRating:
          ratings.length === 0
            ? null
            : ratings.reduce((total, rating) => total + rating, 0) /
              ratings.length,
        comments: snapshot.docs.map((document) =>
          toJson({
            body: document.get('body') ?? null,
            createdAt: document.get('createdAt'),
            rating: document.get('rating'),
          }),
        ),
        responseCount: ratings.length,
      },
    });
  }),
);

communityRouter.get(
  '/circles',
  asyncRoute(async (request, response) => {
    response.json({
      circles: await listActivities(
        asAuthed(request),
        'CIRCLE',
        stringQuery(request.query.city),
      ),
    });
  }),
);

communityRouter.post(
  '/circles',
  asyncRoute(async (request, response) => {
    response.status(201).json({
      circle: await createActivity(asAuthed(request), 'CIRCLE'),
    });
  }),
);

communityRouter.patch(
  '/circles/:circleId',
  asyncRoute(async (request, response) => {
    response.json({
      circle: await updateActivity(
        asAuthed(request),
        'CIRCLE',
        request.params.circleId,
      ),
    });
  }),
);

communityRouter.post(
  '/circles/:circleId/cancel',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    response.json({
      circle: await cancelActivity(
        asAuthed(request).userId,
        'CIRCLE',
        request.params.circleId,
        body.reason,
      ),
    });
  }),
);

communityRouter.post(
  '/circles/:circleId/join',
  asyncRoute(async (request, response) => {
    response.json({
      membership: await joinActivity(
        asAuthed(request).userId,
        'CIRCLE',
        request.params.circleId,
      ),
    });
  }),
);

communityRouter.post(
  '/circles/:circleId/leave',
  asyncRoute(async (request, response) => {
    response.json(
      await leaveActivity(
        asAuthed(request).userId,
        'CIRCLE',
        request.params.circleId,
      ),
    );
  }),
);

communityRouter.get(
  '/circles/:circleId/members',
  asyncRoute(async (request, response) => {
    response.json({
      members: await listMembers(
        asAuthed(request).userId,
        'CIRCLE',
        request.params.circleId,
      ),
    });
  }),
);

communityRouter.patch(
  '/circles/:circleId/members/:memberId',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    response.json({
      membership: await updateMembership(
        asAuthed(request).userId,
        'CIRCLE',
        request.params.circleId,
        request.params.memberId,
        requiredMembershipStatus(body.status),
      ),
    });
  }),
);

communityRouter.get(
  '/me/activities',
  asyncRoute(async (request, response) => {
    response.json(await listMyActivities(asAuthed(request).userId));
  }),
);

communityRouter.get(
  '/recommendations',
  asyncRoute(async (request, response) => {
    const authed = asAuthed(request);
    const user = await getRequiredDocument('users', authed.userId);
    const profile = user.get('profile') as {
      city?: string;
      interests?: string[];
    } | null;
    const [events, circles] = await Promise.all([
      listActivities(authed, 'EVENT', profile?.city),
      listActivities(authed, 'CIRCLE', profile?.city),
    ]);
    const interests = new Set(
      (profile?.interests ?? []).map((interest) => interest.toLowerCase()),
    );
    const recommendations = [...events, ...circles]
      .map((activity) => ({
        activity,
        relevance: ((activity.interests as string[]) ?? []).filter((interest) =>
          interests.has(interest.toLowerCase()),
        ).length,
      }))
      .sort(
        (left, right) =>
          right.relevance - left.relevance ||
          Date.parse(String(left.activity.startsAt)) -
            Date.parse(String(right.activity.startsAt)),
      )
      .map(({ activity }) => activity);
    response.json({ recommendations });
  }),
);

communityRouter.get(
  '/icebreakers/:type/:activityId',
  asyncRoute(async (request, response) => {
    const type = requiredType(request.params.type);
    const userId = asAuthed(request).userId;
    const activity = await assertChatAccess(
      userId,
      type,
      request.params.activityId,
    );
    const currentUser = await getRequiredDocument('users', userId);
    const interests = new Set<string>(
      ((currentUser.get('profile.interests') as string[]) ?? []).map((value) =>
        value.toLowerCase(),
      ),
    );
    const memberships = await db
      .collection(membershipCollection(type))
      .where(activityIdField(type), '==', request.params.activityId)
      .get();
    const members = await Promise.all(
      memberships.docs
        .filter((member) =>
          ['APPROVED', 'ATTENDED'].includes(member.get('status')),
        )
        .filter((member) => member.get('userId') !== userId)
        .map(async (member) => {
          const user = await db
            .collection('users')
            .doc(member.get('userId'))
            .get();
          const shared = (
            (user.get('profile.interests') as string[]) ?? []
          ).filter((interest) => interests.has(interest.toLowerCase()));
          return {
            displayName: user.get('displayName') ?? null,
            id: user.id,
            profilePhotoUrl: user.get('profile.profilePhotoUrl') ?? null,
            prompts: shared.length
              ? [`Ask about ${shared[0]}.`, 'What made you choose this plan?']
              : [
                  'What made you choose this plan?',
                  'What are you enjoying lately?',
                ],
            sharedInterests: shared,
          };
        }),
    );
    response.json({ activityTitle: activity.get('title'), members });
  }),
);

communityRouter.post(
  '/host-approval/request',
  asyncRoute(async (request, response) => {
    const userId = asAuthed(request).userId;
    const user = await getRequiredDocument('users', userId);
    if (
      !user.get('profile') ||
      user.get('trust.verificationStatus') !== 'VERIFIED'
    ) {
      throw new HttpError(403, 'Complete your profile and verification first.');
    }
    const reference = db.collection('hostApprovals').doc(userId);
    const existing = await reference.get();
    if (existing.get('status') === 'APPROVED') {
      response.json({ approval: documentToJson(existing) });
      return;
    }
    await reference.set(
      {
        createdAt: existing.get('createdAt') ?? Timestamp.now(),
        reason: null,
        requestedAt: Timestamp.now(),
        reviewedAt: null,
        reviewerId: null,
        status: 'PENDING',
        updatedAt: Timestamp.now(),
        userId,
      },
      { merge: true },
    );
    response.json({ approval: documentToJson(await reference.get()) });
  }),
);

communityRouter.get(
  '/host-approval',
  asyncRoute(async (request, response) => {
    const reference = db
      .collection('hostApprovals')
      .doc(asAuthed(request).userId);
    const approval = await reference.get();
    response.json({
      approval: approval.exists
        ? documentToJson(approval)
        : {
            reason: null,
            requestedAt: null,
            reviewedAt: null,
            status: 'NOT_REQUESTED',
            userId: asAuthed(request).userId,
          },
    });
  }),
);

communityRouter.get(
  '/chats/:type/:activityId/messages',
  asyncRoute(async (request, response) => {
    const type = requiredType(request.params.type);
    await assertChatAccess(
      asAuthed(request).userId,
      type,
      request.params.activityId,
    );
    const messages = await db
      .collection('chatThreads')
      .doc(threadId(type, request.params.activityId))
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limitToLast(200)
      .get();
    response.json({
      messages: messages.docs.map((document) => documentToJson(document)),
    });
  }),
);

communityRouter.post(
  '/chats/:type/:activityId/messages',
  asyncRoute(async (request, response) => {
    const type = requiredType(request.params.type);
    const userId = asAuthed(request).userId;
    await assertChatAccess(userId, type, request.params.activityId);
    const body = assertObject(request.body);
    const messageBody = requiredString(body, 'body', 500);
    const user = await getRequiredDocument('users', userId);
    const threadReference = db
      .collection('chatThreads')
      .doc(threadId(type, request.params.activityId));
    const messageReference = threadReference.collection('messages').doc();
    const now = Timestamp.now();
    await Promise.all([
      messageReference.set({
        body: messageBody,
        createdAt: now,
        id: messageReference.id,
        sender: {
          displayName: user.get('displayName') ?? null,
          id: userId,
          username: user.get('username') ?? null,
        },
        senderId: userId,
      }),
      threadReference.set({ updatedAt: now }, { merge: true }),
    ]);
    response.status(201).json({
      message: documentToJson(await messageReference.get()),
    });
  }),
);

communityRouter.get(
  '/notifications',
  asyncRoute(async (request, response) => {
    const snapshot = await db
      .collection('notifications')
      .where('userId', '==', asAuthed(request).userId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    response.json({
      notifications: snapshot.docs.map((document) => documentToJson(document)),
    });
  }),
);

communityRouter.patch(
  '/notifications/:notificationId/read',
  asyncRoute(async (request, response) => {
    const notification = await getRequiredDocument(
      'notifications',
      request.params.notificationId,
    );
    if (notification.get('userId') !== asAuthed(request).userId) {
      throw new HttpError(404, 'Notification was not found.');
    }
    await notification.ref.update({ readAt: Timestamp.now() });
    response.json({
      notification: documentToJson(await notification.ref.get()),
    });
  }),
);

communityRouter.post(
  '/push-tokens',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const token = requiredString(body, 'token', 4096);
    const platform = requiredString(body, 'platform', 20);
    if (!['android', 'ios'].includes(platform)) {
      throw new HttpError(400, 'Unsupported device platform.');
    }
    const userId = asAuthed(request).userId;
    const reference = db
      .collection('pushTokens')
      .doc(stableTokenId(userId, token));
    await reference.set({
      createdAt: Timestamp.now(),
      id: reference.id,
      platform,
      token,
      updatedAt: Timestamp.now(),
      userId,
    });
    response.json({ pushToken: documentToJson(await reference.get()) });
  }),
);

communityRouter.post(
  '/reports',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const reason = requiredString(body, 'reason', 50);
    if (
      ![
        'SPAM',
        'FAKE_PROFILE',
        'HARASSMENT',
        'INAPPROPRIATE_BEHAVIOUR',
        'OTHER',
      ].includes(reason)
    ) {
      throw new HttpError(400, 'Choose a valid report reason.');
    }
    const reportedUserId = optionalString(body, 'reportedUserId', 128);
    const eventId = optionalString(body, 'eventId', 128);
    const circleId = optionalString(body, 'circleId', 128);
    if (!reportedUserId && !eventId && !circleId) {
      throw new HttpError(400, 'Choose a member or plan to report.');
    }
    if (reportedUserId === asAuthed(request).userId) {
      throw new HttpError(400, 'You cannot report yourself.');
    }
    const reference = db.collection('reports').doc();
    await reference.create({
      circleId,
      confirmed: false,
      createdAt: Timestamp.now(),
      details: optionalString(body, 'details', 1000),
      eventId,
      id: reference.id,
      reason,
      reportedUserId,
      reporterId: asAuthed(request).userId,
      reviewedAt: null,
      reviewerId: null,
      status: 'OPEN',
      updatedAt: Timestamp.now(),
    });
    response
      .status(201)
      .json({ report: documentToJson(await reference.get()) });
  }),
);

communityRouter.post(
  '/blocks',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const blockedId = requiredString(body, 'blockedUserId', 128);
    const blockerId = asAuthed(request).userId;
    if (blockedId === blockerId)
      throw new HttpError(400, 'You cannot block yourself.');
    await getRequiredDocument('users', blockedId);
    const reference = db.collection('blocks').doc(`${blockerId}_${blockedId}`);
    await reference.set({
      blockedId,
      blockerId,
      createdAt: Timestamp.now(),
      id: reference.id,
    });
    response.status(201).json({ block: documentToJson(await reference.get()) });
  }),
);

communityRouter.get(
  '/blocks',
  asyncRoute(async (request, response) => {
    const snapshot = await db
      .collection('blocks')
      .where('blockerId', '==', asAuthed(request).userId)
      .get();
    const blocks = await Promise.all(
      snapshot.docs.map(async (document) => {
        const user = await db
          .collection('users')
          .doc(document.get('blockedId'))
          .get();
        return toJson({
          ...document.data(),
          blocked: publicUser(user.data()),
          id: document.id,
        });
      }),
    );
    response.json({ blocks });
  }),
);

communityRouter.delete(
  '/blocks/:blockedUserId',
  asyncRoute(async (request, response) => {
    await db
      .collection('blocks')
      .doc(`${asAuthed(request).userId}_${request.params.blockedUserId}`)
      .delete();
    response.json({ unblocked: true });
  }),
);

communityRouter.get(
  '/settings',
  asyncRoute(async (request, response) => {
    const user = await getRequiredDocument('users', asAuthed(request).userId);
    response.json({ settings: user.get('settings') ?? defaultSettings() });
  }),
);

communityRouter.patch(
  '/settings',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const updates: Record<string, boolean> = {};
    for (const field of Object.keys(defaultSettings())) {
      if (body[field] !== undefined)
        updates[field] = requiredBoolean(body, field);
    }
    const reference = db.collection('users').doc(asAuthed(request).userId);
    await reference.update({
      ...Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [
          `settings.${key}`,
          value,
        ]),
      ),
      updatedAt: Timestamp.now(),
    });
    const user = await reference.get();
    response.json({ settings: user.get('settings') ?? defaultSettings() });
  }),
);

communityRouter.patch(
  '/emergency-contact',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const emergencyContact = {
      name: requiredString(body, 'name', 80),
      phone: requiredString(body, 'phone', 30),
      relationship: requiredString(body, 'relationship', 60),
      updatedAt: Timestamp.now(),
    };
    await db.collection('users').doc(asAuthed(request).userId).update({
      emergencyContact,
      updatedAt: Timestamp.now(),
    });
    response.json({ emergencyContact: toJson(emergencyContact) });
  }),
);

export async function dispatchPendingPushNotifications(limit = 100) {
  const notifications = await db
    .collection('notifications')
    .where('pushStatus', '==', 'PENDING')
    .limit(limit)
    .get();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const notification of notifications.docs) {
    const tokens = await db
      .collection('pushTokens')
      .where('userId', '==', notification.get('userId'))
      .get();
    if (tokens.empty) {
      await notification.ref.update({ pushStatus: 'SKIPPED' });
      skipped += 1;
      continue;
    }
    try {
      const { messaging } = await import('./core');
      const result = await messaging.sendEachForMulticast({
        data: Object.fromEntries(
          Object.entries(
            (notification.get('metadata') ?? {}) as Record<string, unknown>,
          ).map(([key, value]) => [key, String(value)]),
        ),
        notification: {
          body: notification.get('body'),
          title: notification.get('title'),
        },
        tokens: tokens.docs.map((token) => token.get('token')),
      });
      await notification.ref.update({
        pushStatus: result.successCount > 0 ? 'SENT' : 'FAILED',
        pushedAt: Timestamp.now(),
      });
      if (result.successCount > 0) sent += 1;
      else failed += 1;
      const stale = result.responses
        .map((entry, index) => ({ entry, token: tokens.docs[index] }))
        .filter(({ entry }) =>
          [
            'messaging/invalid-registration-token',
            'messaging/registration-token-not-registered',
          ].includes(entry.error?.code ?? ''),
        );
      await Promise.all(stale.map(({ token }) => token.ref.delete()));
    } catch (error) {
      console.error('Push delivery failed', notification.id, error);
      await notification.ref.update({ pushStatus: 'FAILED' });
      failed += 1;
    }
  }
  return { failed, sent, skipped };
}

function requiredType(input: string): ActivityType {
  if (input !== 'EVENT' && input !== 'CIRCLE') {
    throw new HttpError(400, 'Activity type must be EVENT or CIRCLE.');
  }
  return input;
}

function requiredMembershipStatus(input: unknown): MembershipStatus {
  if (
    typeof input !== 'string' ||
    !['REQUESTED', 'APPROVED', 'CANCELLED', 'ATTENDED', 'NO_SHOW'].includes(
      input,
    )
  ) {
    throw new HttpError(400, 'Invalid membership status.');
  }
  return input as MembershipStatus;
}

function stringQuery(input: unknown) {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined;
}

function stableTokenId(userId: string, token: string) {
  let hash = 2166136261;
  for (const character of token) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${userId}_${(hash >>> 0).toString(36)}`;
}
