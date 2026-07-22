import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import {
  activityCollection,
  hydrateActivity,
  notifyMembers,
} from './activities';
import { dispatchPendingPushNotifications } from './community';
import {
  asAuthed,
  assertObject,
  asyncRoute,
  bucket,
  countCollection,
  createNotification,
  db,
  documentToJson,
  getRequiredDocument,
  HttpError,
  optionalString,
  publicUser,
  requiredBoolean,
  requiredString,
  SUPPORTED_CITIES,
  Timestamp,
  toJson,
  type ActivityType,
  type AdminRole,
  type AuthenticatedRequest,
} from './core';
import { adminKey } from './params';

const ADMIN_ROLES: AdminRole[] = [
  'REVIEWER',
  'MODERATOR',
  'COMMUNITY_MANAGER',
  'SUPER_ADMIN',
];

export const adminRouter = Router();
adminRouter.use(loadAdmin);

adminRouter.get(
  '/me',
  asyncRoute(async (request, response) => {
    response.json({ admin: asAuthed(request).admin });
  }),
);

adminRouter.post(
  '/access',
  asyncRoute(async (request, response) => {
    const authed = asAuthed(request);
    const bootstrapKey = request.get('x-niva-admin-key');
    const bootstrapSecret = adminKey.value();
    const validBootstrap =
      Boolean(bootstrapSecret) && bootstrapKey === bootstrapSecret;
    if (!validBootstrap && authed.admin?.role !== 'SUPER_ADMIN') {
      throw new HttpError(403, 'A valid bootstrap key is required.');
    }
    const body = assertObject(request.body);
    const userId = requiredString(body, 'userId', 128);
    const role = requiredString(body, 'role', 40) as AdminRole;
    if (!ADMIN_ROLES.includes(role))
      throw new HttpError(400, 'Invalid admin role.');
    if (
      validBootstrap &&
      (userId !== authed.userId || role !== 'SUPER_ADMIN')
    ) {
      throw new HttpError(
        403,
        'The one-time bootstrap can only grant your signed-in account SUPER_ADMIN.',
      );
    }
    await getRequiredDocument('users', userId);
    const reference = db.collection('adminAccess').doc(userId);
    const bootstrapReference = db.collection('system').doc('adminBootstrap');
    await db.runTransaction(async (transaction) => {
      if (validBootstrap) {
        const bootstrap = await transaction.get(bootstrapReference);
        if (bootstrap.get('completed') === true) {
          throw new HttpError(
            409,
            'The first administrator has already been created.',
          );
        }
        transaction.set(bootstrapReference, {
          completed: true,
          completedAt: Timestamp.now(),
          userId,
        });
      }
      transaction.set(
        reference,
        {
          createdAt: Timestamp.now(),
          grantedBy: authed.admin?.userId ?? 'bootstrap-key',
          role,
          updatedAt: Timestamp.now(),
          userId,
        },
        { merge: true },
      );
    });
    await audit(authed, 'ADMIN_ACCESS_GRANTED', 'adminAccess', userId, {
      role,
    });
    response.json({ access: documentToJson(await reference.get()) });
  }),
);

adminRouter.get(
  '/verification-reviews',
  withRoles(['REVIEWER', 'MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const status = stringQuery(request.query.status);
    let query = db.collection('verificationReviews').limit(200);
    if (status) query = query.where('status', '==', status);
    const reviews = await query.get();
    response.json({
      reviews: await Promise.all(
        reviews.docs.map(async (review) => {
          const user = await db
            .collection('users')
            .doc(review.get('userId'))
            .get();
          return toJson({
            ...review.data(),
            id: review.id,
            selfieStoragePath:
              user.get('selfieVerification.selfieStoragePath') ?? null,
            user: publicUser(user.data()),
          });
        }),
      ),
    });
  }),
);

adminRouter.get(
  '/verification-reviews/:userId/selfie',
  withRoles(['REVIEWER', 'MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const user = await getRequiredDocument('users', request.params.userId);
    const storagePath = user.get('selfieVerification.selfieStoragePath');
    if (typeof storagePath !== 'string') {
      throw new HttpError(404, 'This review has no selfie evidence.');
    }
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 60 * 1000,
    });
    response.json({ url });
  }),
);

adminRouter.patch(
  '/verification-reviews/:userId',
  withRoles(['REVIEWER', 'MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const status = requiredString(body, 'status', 30);
    if (!['APPROVED', 'REJECTED', 'NEEDS_REVIEW'].includes(status)) {
      throw new HttpError(400, 'Invalid review status.');
    }
    const reason = optionalString(body, 'reason', 500);
    const userId = request.params.userId;
    const review = await getRequiredDocument('verificationReviews', userId);
    const user = await getRequiredDocument('users', userId);
    const now = Timestamp.now();
    const selfieDeletionDueAt =
      status === 'APPROVED' || status === 'REJECTED'
        ? Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000)
        : null;
    const selfieStatus = status;
    const verificationStatus =
      status === 'APPROVED'
        ? 'VERIFIED'
        : status === 'REJECTED'
          ? 'RESTRICTED'
          : 'PENDING';
    await Promise.all([
      review.ref.update({
        reason,
        reviewedAt: now,
        reviewerId: asAuthed(request).admin?.userId,
        status,
        updatedAt: now,
      }),
      user.ref.update({
        'selfieVerification.deletionDueAt': selfieDeletionDueAt,
        'selfieVerification.reason': reason,
        'selfieVerification.reviewedAt': now,
        'selfieVerification.status': selfieStatus,
        'trust.tier': status === 'APPROVED' ? 'BASIC_VERIFIED' : 'NEW',
        'trust.verificationStatus': verificationStatus,
        updatedAt: now,
      }),
      createNotification(
        userId,
        status === 'APPROVED' ? 'Profile verified' : 'Verification update',
        status === 'APPROVED'
          ? 'Your Niva profile is verified.'
          : reason || 'Your verification needs another look.',
        {},
        'VERIFICATION_APPROVED',
      ),
    ]);
    await audit(
      asAuthed(request),
      'VERIFICATION_REVIEWED',
      'verificationReview',
      userId,
      { reason, status },
    );
    response.json({
      review: documentToJson(await review.ref.get()),
      user: documentToJson(await user.ref.get()),
    });
  }),
);

adminRouter.get(
  '/reports',
  withRoles(['MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const status = stringQuery(request.query.status);
    let query = db.collection('reports').limit(200);
    if (status) query = query.where('status', '==', status);
    const reports = await query.get();
    response.json({
      reports: await Promise.all(
        reports.docs.map(async (report) => {
          const [reporter, reportedUser, event, circle] = await Promise.all([
            db.collection('users').doc(report.get('reporterId')).get(),
            report.get('reportedUserId')
              ? db.collection('users').doc(report.get('reportedUserId')).get()
              : Promise.resolve(null),
            report.get('eventId')
              ? db.collection('events').doc(report.get('eventId')).get()
              : Promise.resolve(null),
            report.get('circleId')
              ? db.collection('circles').doc(report.get('circleId')).get()
              : Promise.resolve(null),
          ]);
          return toJson({
            ...report.data(),
            circle: circle?.exists
              ? { id: circle.id, title: circle.get('title') }
              : null,
            event: event?.exists
              ? { id: event.id, title: event.get('title') }
              : null,
            id: report.id,
            reportedUser: reportedUser?.exists
              ? publicUser(reportedUser.data())
              : null,
            reporter: publicUser(reporter.data()),
          });
        }),
      ),
    });
  }),
);

adminRouter.patch(
  '/reports/:reportId',
  withRoles(['MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const status = requiredString(body, 'status', 30);
    if (!['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      throw new HttpError(400, 'Invalid report status.');
    }
    const confirmed = requiredBoolean(body, 'confirmed');
    const report = await getRequiredDocument(
      'reports',
      request.params.reportId,
    );
    await report.ref.update({
      confirmed,
      reviewedAt: Timestamp.now(),
      reviewerId: asAuthed(request).admin?.userId,
      status,
      updatedAt: Timestamp.now(),
    });
    if (report.get('reportedUserId') && confirmed) {
      const user = await db
        .collection('users')
        .doc(report.get('reportedUserId'))
        .get();
      if (user.exists) {
        await user.ref.update({
          'trust.tier': 'NEW',
          'trust.verificationStatus': 'RESTRICTED',
          updatedAt: Timestamp.now(),
        });
      }
    }
    await createNotification(
      report.get('reporterId'),
      'Report update',
      status === 'RESOLVED'
        ? 'The Niva safety team reviewed your report.'
        : `Your report is now ${status.toLowerCase()}.`,
      { reportId: report.id },
      'REPORT_UPDATE',
    );
    await audit(
      asAuthed(request),
      'REPORT_STATUS_CHANGED',
      'report',
      report.id,
      {
        confirmed,
        status,
      },
    );
    response.json({ report: documentToJson(await report.ref.get()) });
  }),
);

adminRouter.get(
  '/host-approvals',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const status = stringQuery(request.query.status);
    let query = db.collection('hostApprovals').limit(200);
    if (status) query = query.where('status', '==', status);
    const approvals = await query.get();
    response.json({
      approvals: await Promise.all(
        approvals.docs.map(async (approval) => {
          const user = await db
            .collection('users')
            .doc(approval.get('userId'))
            .get();
          return toJson({
            ...approval.data(),
            id: approval.id,
            user: publicUser(user.data()),
          });
        }),
      ),
    });
  }),
);

adminRouter.patch(
  '/host-approvals/:userId',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const status = requiredString(body, 'status', 30);
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new HttpError(400, 'Invalid host approval status.');
    }
    const reference = db.collection('hostApprovals').doc(request.params.userId);
    await reference.set(
      {
        reason: optionalString(body, 'reason', 500),
        reviewedAt: Timestamp.now(),
        reviewerId: asAuthed(request).admin?.userId,
        status,
        updatedAt: Timestamp.now(),
        userId: request.params.userId,
      },
      { merge: true },
    );
    await createNotification(
      request.params.userId,
      'Host access update',
      status === 'APPROVED'
        ? 'You can now create plans on Niva.'
        : 'Your host request needs more information.',
      {},
      'HOST_APPROVAL_UPDATE',
    );
    await audit(
      asAuthed(request),
      'HOST_APPROVAL_CHANGED',
      'hostApproval',
      request.params.userId,
      { status },
    );
    response.json({ approval: documentToJson(await reference.get()) });
  }),
);

adminRouter.get(
  '/activities',
  withRoles(['REVIEWER', 'MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const status = stringQuery(request.query.status);
    const city = stringQuery(request.query.city)?.toLowerCase();
    const search = stringQuery(request.query.q)?.toLowerCase();
    const fetch = async (type: ActivityType) => {
      let query = db.collection(activityCollection(type)).limit(300);
      if (status) query = query.where('status', '==', status);
      const snapshot = await query.get();
      return Promise.all(
        snapshot.docs
          .filter((document) => {
            const data = document.data();
            return (
              (!city || String(data.city).toLowerCase() === city) &&
              (!search ||
                String(data.title).toLowerCase().includes(search) ||
                String(data.locationName).toLowerCase().includes(search))
            );
          })
          .map(async (document) => {
            const host = await db
              .collection('users')
              .doc(document.get('hostId'))
              .get();
            return toJson({
              ...document.data(),
              host: publicUser(host.data()),
              id: document.id,
            });
          }),
      );
    };
    const [events, circles] = await Promise.all([
      fetch('EVENT'),
      fetch('CIRCLE'),
    ]);
    response.json({ circles, events });
  }),
);

adminRouter.get(
  '/members',
  withRoles(['REVIEWER', 'MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const search = stringQuery(request.query.q)?.toLowerCase();
    const city = stringQuery(request.query.city)?.toLowerCase();
    const requestedLimit = Number(request.query.limit ?? 50);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(100, Math.max(1, requestedLimit))
      : 50;
    const users = await db.collection('users').limit(500).get();
    response.json({
      members: users.docs
        .filter((user) => {
          const data = user.data();
          return (
            (!city ||
              String(data.profile?.city ?? '').toLowerCase() === city) &&
            (!search ||
              [data.displayName, data.username, data.email, data.phone]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(search)))
          );
        })
        .slice(0, limit)
        .map((user) => documentToJson(user)),
    });
  }),
);

adminRouter.get(
  '/analytics/summary',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (_request, response) => {
    const [
      eventMembers,
      circleMembers,
      feedbackSubmitted,
      continuityPreferences,
    ] = await Promise.all([
      db.collection('eventMembers').get(),
      db.collection('circleMembers').get(),
      countCollection('feedback'),
      countCollection('continuityPreferences'),
    ]);
    const memberships = [...eventMembers.docs, ...circleMembers.docs];
    const participants = new Map<string, number>();
    memberships.forEach((membership) => {
      if (['APPROVED', 'ATTENDED'].includes(membership.get('status'))) {
        const userId = membership.get('userId');
        participants.set(userId, (participants.get(userId) ?? 0) + 1);
      }
    });
    response.json({
      analytics: {
        attendanceRecorded: memberships.filter((member) =>
          ['ATTENDED', 'NO_SHOW'].includes(member.get('status')),
        ).length,
        continuityPreferences,
        feedbackSubmitted,
        icebreakersViewed: 0,
        joinRequests: memberships.length,
        membershipApprovals: memberships.filter((member) =>
          ['APPROVED', 'ATTENDED'].includes(member.get('status')),
        ).length,
        recommendationViews: 0,
        repeatParticipants: [...participants.values()].filter(
          (count) => count > 1,
        ).length,
      },
    });
  }),
);

adminRouter.get(
  '/account-deletion-requests',
  withRoles(['MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    response.json({
      requests: await listQueue(
        'accountDeletionRequests',
        stringQuery(request.query.status) ?? 'PENDING',
      ),
    });
  }),
);

adminRouter.patch(
  '/account-deletion-requests/:requestId',
  withRoles(['MODERATOR', 'COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const status = requiredString(body, 'status', 30);
    if (!['IN_REVIEW', 'COMPLETED', 'REJECTED'].includes(status)) {
      throw new HttpError(400, 'Invalid deletion request status.');
    }
    const item = await getRequiredDocument(
      'accountDeletionRequests',
      request.params.requestId,
    );
    await item.ref.update({ status, updatedAt: Timestamp.now() });
    await audit(
      asAuthed(request),
      'ACCOUNT_DELETION_REQUEST_UPDATED',
      'accountDeletionRequest',
      item.id,
      { status },
    );
    response.json({ request: documentToJson(await item.ref.get()) });
  }),
);

adminRouter.get(
  '/beta-access-requests',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    response.json({
      requests: await listQueue(
        'betaAccessRequests',
        stringQuery(request.query.status) ?? 'PENDING',
      ),
    });
  }),
);

adminRouter.patch(
  '/beta-access-requests/:requestId',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const status = requiredString(body, 'status', 30);
    if (!['INVITED', 'DECLINED'].includes(status)) {
      throw new HttpError(400, 'Invalid beta request status.');
    }
    const item = await getRequiredDocument(
      'betaAccessRequests',
      request.params.requestId,
    );
    await item.ref.update({ status, updatedAt: Timestamp.now() });
    response.json({ request: documentToJson(await item.ref.get()) });
  }),
);

adminRouter.post(
  '/events/:eventId/cancel',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    response.json({
      event: await adminCancel(
        asAuthed(request),
        'EVENT',
        request.params.eventId,
        assertObject(request.body).reason,
      ),
    });
  }),
);

adminRouter.post(
  '/circles/:circleId/cancel',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    response.json({
      circle: await adminCancel(
        asAuthed(request),
        'CIRCLE',
        request.params.circleId,
        assertObject(request.body).reason,
      ),
    });
  }),
);

adminRouter.patch(
  '/events/:eventId/location',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    response.json({
      event: await adminLocation(
        asAuthed(request),
        'EVENT',
        request.params.eventId,
        assertObject(request.body),
      ),
    });
  }),
);

adminRouter.patch(
  '/circles/:circleId/location',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    response.json({
      circle: await adminLocation(
        asAuthed(request),
        'CIRCLE',
        request.params.circleId,
        assertObject(request.body),
      ),
    });
  }),
);

adminRouter.post(
  '/notification-deliveries/dispatch',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const dispatch = await dispatchPendingPushNotifications();
    await audit(
      asAuthed(request),
      'NOTIFICATION_DELIVERY_DISPATCHED',
      'notificationDelivery',
      'batch',
      dispatch,
    );
    response.json({ dispatch });
  }),
);

adminRouter.post(
  '/trust/recalculate',
  withRoles(['COMMUNITY_MANAGER']),
  asyncRoute(async (request, response) => {
    const users = await db.collection('users').get();
    const batch = db.batch();
    users.docs.forEach((user) => {
      const verified = user.get('selfieVerification.status') === 'APPROVED';
      batch.update(user.ref, {
        'trust.tier': verified ? 'BASIC_VERIFIED' : 'NEW',
        'trust.verificationStatus': verified ? 'VERIFIED' : 'UNVERIFIED',
        updatedAt: Timestamp.now(),
      });
    });
    await batch.commit();
    const result = { recalculated: users.size };
    await audit(
      asAuthed(request),
      'TRUST_RECALCULATED',
      'trustProfile',
      'all',
      result,
    );
    response.json(result);
  }),
);

async function loadAdmin(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const authed = asAuthed(request);
    const access = await db.collection('adminAccess').doc(authed.userId).get();
    if (
      access.exists &&
      ADMIN_ROLES.includes(access.get('role') as AdminRole)
    ) {
      authed.admin = {
        label: authed.firebaseUser.email ?? authed.userId,
        role: access.get('role') as AdminRole,
        userId: authed.userId,
      };
      next();
      return;
    }
    if (
      request.path === '/access' &&
      Boolean(adminKey.value()) &&
      request.get('x-niva-admin-key') === adminKey.value()
    ) {
      next();
      return;
    }
    throw new HttpError(403, 'This account does not have Niva admin access.');
  } catch (error) {
    next(error);
  }
}

function withRoles(roles: AdminRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const role = asAuthed(request).admin?.role;
    if (role === 'SUPER_ADMIN' || (role && roles.includes(role))) {
      next();
      return;
    }
    next(new HttpError(403, 'Your admin role cannot perform this action.'));
  };
}

async function audit(
  request: AuthenticatedRequest,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  const reference = db.collection('adminAuditLogs').doc();
  await reference.create({
    action,
    actorLabel: request.admin?.label ?? 'bootstrap-key',
    actorUserId: request.admin?.userId ?? null,
    createdAt: Timestamp.now(),
    id: reference.id,
    metadata,
    targetId,
    targetType,
  });
}

async function listQueue(collection: string, status: string) {
  const snapshot = await db
    .collection(collection)
    .where('status', '==', status)
    .limit(200)
    .get();
  return snapshot.docs.map((document) => documentToJson(document));
}

async function adminCancel(
  request: AuthenticatedRequest,
  type: ActivityType,
  id: string,
  reasonValue: unknown,
) {
  const reason = typeof reasonValue === 'string' ? reasonValue.trim() : '';
  if (reason.length < 3 || reason.length > 300) {
    throw new HttpError(400, 'Give members a short cancellation reason.');
  }
  const activity = await getRequiredDocument(activityCollection(type), id);
  if (!['DRAFT', 'PUBLISHED'].includes(activity.get('status'))) {
    throw new HttpError(409, 'This activity cannot be cancelled.');
  }
  await activity.ref.update({
    cancellationReason: reason,
    cancelledAt: Timestamp.now(),
    status: 'CANCELLED',
    updatedAt: Timestamp.now(),
  });
  await notifyMembers(
    type,
    id,
    `${String(activity.get('title'))} was cancelled`,
    reason,
    'ACTIVITY_CANCELLED',
  );
  await audit(request, 'ACTIVITY_CANCELLED', type.toLowerCase(), id, {
    reason,
  });
  return hydrateActivity(request.userId, type, await activity.ref.get());
}

async function adminLocation(
  request: AuthenticatedRequest,
  type: ActivityType,
  id: string,
  body: Record<string, unknown>,
) {
  const activity = await getRequiredDocument(activityCollection(type), id);
  const city =
    body.city === undefined
      ? (activity.get('city') as string)
      : requiredString(body, 'city', 80);
  if (!SUPPORTED_CITIES.includes(city)) {
    throw new HttpError(400, 'This city is not supported.');
  }
  const locationName = requiredString(body, 'locationName', 140);
  const coordinates: Record<string, number | null> = {};
  for (const [field, minimum, maximum] of [
    ['latitude', -90, 90],
    ['longitude', -180, 180],
  ] as const) {
    if (body[field] === undefined) continue;
    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      throw new HttpError(400, `${field} is invalid.`);
    }
    coordinates[field] = value;
  }
  await activity.ref.update({
    city,
    locationName,
    ...coordinates,
    updatedAt: Timestamp.now(),
  });
  await notifyMembers(
    type,
    id,
    'Location updated',
    `${String(activity.get('title'))} now meets at ${locationName}.`,
    'HOST_UPDATED_LOCATION',
  );
  await audit(request, 'ACTIVITY_LOCATION_UPDATED', type.toLowerCase(), id, {
    city,
    locationName,
    ...coordinates,
  });
  return hydrateActivity(request.userId, type, await activity.ref.get());
}

function stringQuery(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
