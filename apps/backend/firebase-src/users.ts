import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  asAuthed,
  assertObject,
  asyncRoute,
  auth,
  bucket,
  db,
  documentToJson,
  getRequiredDocument,
  HttpError,
  optionalString,
  requiredBoolean,
  requiredNumber,
  requiredString,
  requiredStringArray,
  SUPPORTED_CITIES,
  Timestamp,
  upsertUserFromToken,
} from './core';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const CURRENT_LEGAL_VERSION = '2026-07-22';

export const userRouter = Router();

userRouter.get(
  '/me',
  asyncRoute(async (request, response) => {
    const user = await getRequiredDocument('users', asAuthed(request).userId);
    response.json({ user: documentToJson(user) });
  }),
);

userRouter.get(
  '/me/username-availability',
  asyncRoute(async (request, response) => {
    const username = normalizeUsername(String(request.query.username ?? ''));
    const reservation = await db.collection('usernames').doc(username).get();
    response.json({
      available:
        !reservation.exists ||
        reservation.get('userId') === asAuthed(request).userId,
      username,
    });
  }),
);

userRouter.post(
  '/me/username',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const username = normalizeUsername(requiredString(body, 'username', 20));
    const userId = asAuthed(request).userId;
    await assertCurrentLegalAcceptance(userId);
    const userReference = db.collection('users').doc(userId);
    const usernameReference = db.collection('usernames').doc(username);

    await db.runTransaction(async (transaction) => {
      const [user, reservation] = await Promise.all([
        transaction.get(userReference),
        transaction.get(usernameReference),
      ]);
      const oldUsername = user.get('username') as string | null;
      if (reservation.exists && reservation.get('userId') !== userId) {
        throw new HttpError(409, 'That username is already taken.');
      }
      if (oldUsername && oldUsername !== username) {
        transaction.delete(db.collection('usernames').doc(oldUsername));
      }
      transaction.set(usernameReference, {
        createdAt: reservation.get('createdAt') ?? Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId,
        username,
      });
      transaction.update(userReference, {
        username,
        updatedAt: Timestamp.now(),
      });
    });

    response.json({
      user: documentToJson(await userReference.get()),
    });
  }),
);

userRouter.put(
  '/me/profile',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    await assertCurrentLegalAcceptance(asAuthed(request).userId);
    const city = requiredString(body, 'city', 80);
    if (!SUPPORTED_CITIES.includes(city)) {
      throw new HttpError(
        400,
        'Choose one of the cities Niva currently supports.',
      );
    }
    const displayName = requiredString(body, 'displayName', 60);
    const profilePhotoUrl = requiredString(body, 'profilePhotoUrl', 2048);
    try {
      new URL(profilePhotoUrl);
    } catch {
      throw new HttpError(400, 'profilePhotoUrl must be a valid URL.');
    }
    const profile = {
      age: requiredNumber(body, 'age', 18, 100),
      bio: requiredString(body, 'bio', 280),
      city,
      displayName,
      interests: requiredStringArray(body, 'interests', 3, 10),
      languages: requiredStringArray(body, 'languages', 1, 12),
      occupation: optionalString(body, 'occupation', 80),
      profilePhotoUrl,
      updatedAt: Timestamp.now(),
    };
    const reference = db.collection('users').doc(asAuthed(request).userId);
    await reference.update({
      displayName,
      profile,
      updatedAt: Timestamp.now(),
    });
    response.json({ user: documentToJson(await reference.get()) });
  }),
);

userRouter.post(
  '/me/legal-acceptance',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    if (!requiredBoolean(body, 'accepted')) {
      throw new HttpError(
        400,
        'The Terms and Privacy Policy must be accepted.',
      );
    }
    const version = body.version ?? CURRENT_LEGAL_VERSION;
    if (version !== CURRENT_LEGAL_VERSION) {
      throw new HttpError(400, 'Please accept the current policies.');
    }
    const now = Timestamp.now();
    const reference = db.collection('users').doc(asAuthed(request).userId);
    await reference.update({
      legalAcceptedAt: now,
      privacyPolicyVersion: CURRENT_LEGAL_VERSION,
      termsVersion: CURRENT_LEGAL_VERSION,
      updatedAt: now,
    });
    response.json({ user: documentToJson(await reference.get()) });
  }),
);

userRouter.post(
  '/me/selfie',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    const userId = asAuthed(request).userId;
    await assertCurrentLegalAcceptance(userId);
    const storagePath = requiredString(body, 'selfieStoragePath', 500);
    const expected = new RegExp(
      `^verification-selfies/${escapeRegExp(userId)}/[A-Za-z0-9._-]+$`,
    );
    if (!expected.test(storagePath)) {
      throw new HttpError(400, 'The selfie must belong to the signed-in user.');
    }
    const [exists] = await bucket.file(storagePath).exists();
    if (!exists) {
      throw new HttpError(400, 'Upload the selfie before submitting it.');
    }

    const now = Timestamp.now();
    const reference = db.collection('users').doc(userId);
    const existing = await reference.get();
    const previousStoragePath = existing.get(
      'selfieVerification.selfieStoragePath',
    ) as string | null;
    await reference.update({
      selfieVerification: {
        deletedAt: null,
        deletionDueAt: null,
        selfieStoragePath: storagePath,
        status: 'PENDING',
        submittedAt: now,
      },
      'trust.verificationStatus': 'PENDING',
      updatedAt: now,
    });
    await db.collection('verificationReviews').doc(userId).set({
      createdAt: now,
      reason: null,
      reviewedAt: null,
      reviewerId: null,
      status: 'PENDING',
      updatedAt: now,
      userId,
    });
    if (previousStoragePath && previousStoragePath !== storagePath) {
      await bucket.file(previousStoragePath).delete({ ignoreNotFound: true });
    }
    response.json({ user: documentToJson(await reference.get()) });
  }),
);

userRouter.delete(
  '/me',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    if (body.confirmation !== 'DELETE') {
      throw new HttpError(400, 'Type DELETE to confirm account deletion.');
    }
    const userId = asAuthed(request).userId;
    await deleteUserData(userId);
    await Promise.all([
      bucket.deleteFiles({ prefix: `profile-photos/${userId}/` }),
      bucket.deleteFiles({ prefix: `verification-selfies/${userId}/` }),
      bucket.deleteFiles({ prefix: `activity-covers/${userId}/` }),
    ]);
    await auth.deleteUser(userId);
    response.json({ deleted: true });
  }),
);

export async function createSession(idToken: string) {
  let decoded: DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(idToken, true);
  } catch {
    throw new HttpError(
      401,
      'The Firebase sign-in token is invalid or expired.',
    );
  }
  return upsertUserFromToken(decoded);
}

export async function requireCurrentLegalAcceptance(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    await assertCurrentLegalAcceptance(asAuthed(request).userId);
    next();
  } catch (error) {
    next(error);
  }
}

async function assertCurrentLegalAcceptance(userId: string) {
  const user = await getRequiredDocument('users', userId);
  if (
    !user.get('legalAcceptedAt') ||
    user.get('termsVersion') !== CURRENT_LEGAL_VERSION ||
    user.get('privacyPolicyVersion') !== CURRENT_LEGAL_VERSION
  ) {
    throw new HttpError(
      403,
      'Accept the current Terms and Privacy Policy to continue.',
      'LEGAL_ACCEPTANCE_REQUIRED',
    );
  }
}

async function deleteUserData(userId: string) {
  const userReference = db.collection('users').doc(userId);
  const user = await userReference.get();
  const username = user.get('username') as string | null;
  const ownerFields: Array<[string, string]> = [
    ['eventMembers', 'userId'],
    ['circleMembers', 'userId'],
    ['notifications', 'userId'],
    ['pushTokens', 'userId'],
    ['feedback', 'userId'],
    ['continuityPreferences', 'userId'],
    ['reports', 'reporterId'],
    ['blocks', 'blockerId'],
    ['hostApprovals', 'userId'],
    ['verificationReviews', 'userId'],
    ['adminAccess', 'userId'],
  ];

  for (const [collection, field] of ownerFields) {
    const snapshots = await db
      .collection(collection)
      .where(field, '==', userId)
      .get();
    for (let offset = 0; offset < snapshots.docs.length; offset += 400) {
      const batch = db.batch();
      snapshots.docs.slice(offset, offset + 400).forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
    }
  }

  const authoredMessages = await db
    .collectionGroup('messages')
    .where('senderId', '==', userId)
    .get();
  for (let offset = 0; offset < authoredMessages.docs.length; offset += 400) {
    const batch = db.batch();
    authoredMessages.docs.slice(offset, offset + 400).forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  }

  if (username) await db.collection('usernames').doc(username).delete();
  await userReference.delete();
}

export async function cleanupExpiredVerificationSelfies(limit = 200) {
  const now = Timestamp.now();
  const users = await db
    .collection('users')
    .where('selfieVerification.deletionDueAt', '<=', now)
    .limit(limit)
    .get();
  let deleted = 0;

  for (const user of users.docs) {
    const storagePath = user.get('selfieVerification.selfieStoragePath') as
      string | null;
    if (storagePath) {
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    }
    await user.ref.update({
      'selfieVerification.deletedAt': now,
      'selfieVerification.deletionDueAt': null,
      'selfieVerification.selfieStoragePath': null,
      updatedAt: now,
    });
    deleted += 1;
  }

  return { deleted, scanned: users.size };
}

function normalizeUsername(input: string) {
  const username = input.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new HttpError(
      400,
      'Username must be 3-20 lowercase letters, numbers, or underscores.',
    );
  }
  return username;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
