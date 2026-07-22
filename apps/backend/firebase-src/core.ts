import type { NextFunction, Request, Response } from 'express';
import { getApps, initializeApp } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';
import {
  FieldValue,
  getFirestore,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';
import { allowedOrigins } from './params';

if (getApps().length === 0) {
  initializeApp({
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ??
      `${process.env.GCLOUD_PROJECT ?? 'niva-staging'}.firebasestorage.app`,
  });
}

export const auth = getAuth();
export const db = getFirestore();
export const bucket = getStorage().bucket();
export const messaging = getMessaging();
export { FieldValue, Timestamp };

export const SUPPORTED_CITIES = ['Bangalore'];
export const MEMBERSHIP_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'CANCELLED',
  'ATTENDED',
  'NO_SHOW',
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];
export type ActivityType = 'CIRCLE' | 'EVENT';
export type AdminRole =
  'REVIEWER' | 'MODERATOR' | 'COMMUNITY_MANAGER' | 'SUPER_ADMIN';

export interface NivaRequest extends Omit<Request, 'params'> {
  params: Record<string, string>;
}

export interface AuthenticatedRequest extends NivaRequest {
  firebaseUser: DecodedIdToken;
  userId: string;
  admin?: { label: string; role: AdminRole; userId: string };
}

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function asyncRoute(
  handler: (request: NivaRequest, response: Response) => Promise<unknown>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request as NivaRequest, response).catch(next);
  };
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      error: error.code ?? error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
    return;
  }

  console.error('Unhandled API error', error);
  response.status(500).json({
    error: 'Internal Server Error',
    message: 'Niva could not complete this request. Please try again.',
    statusCode: 500,
  });
}

export function corsMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const origin = request.get('origin');
  const configuredOrigins = allowedOrigins
    .value()
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (origin && configuredOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }

  response.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Niva-Admin-Key',
  );
  response.setHeader(
    'Access-Control-Allow-Methods',
    'DELETE, GET, OPTIONS, PATCH, POST, PUT',
  );
  response.setHeader('Access-Control-Max-Age', '3600');

  if (request.method === 'OPTIONS') {
    response.status(204).send();
    return;
  }

  if (origin && !configuredOrigins.includes(origin)) {
    next(new HttpError(403, 'This web origin is not allowed.'));
    return;
  }

  next();
}

export async function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const header = request.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Sign in to continue.');
    }

    const decoded = await auth.verifyIdToken(header.slice(7), true);
    const authed = request as AuthenticatedRequest;
    authed.firebaseUser = decoded;
    authed.userId = decoded.uid;
    await upsertUserFromToken(decoded);
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, 'Your sign-in session is invalid or expired.'));
  }
}

export function asAuthed(request: Request | NivaRequest) {
  return request as AuthenticatedRequest;
}

export async function upsertUserFromToken(decoded: DecodedIdToken) {
  if (!decoded.phone_number && !decoded.email) {
    throw new HttpError(
      401,
      'The Firebase account does not contain a supported identity.',
    );
  }

  const reference = db.collection('users').doc(decoded.uid);
  const existing = await reference.get();
  const now = Timestamp.now();
  const providers = new Set<string>();
  const signInProvider = decoded.firebase?.sign_in_provider;
  const identities = decoded.firebase?.identities ?? {};
  if (decoded.phone_number) providers.add('phone');
  if (decoded.email) providers.add('password');
  if (signInProvider && signInProvider !== 'anonymous') {
    providers.add(signInProvider);
  }
  Object.keys(identities).forEach((provider) => providers.add(provider));

  if (!existing.exists) {
    await reference.create({
      authProviders: [...providers],
      createdAt: now,
      displayName: decoded.name ?? null,
      email: decoded.email ?? null,
      googleVerified: providers.has('google.com'),
      id: decoded.uid,
      legalAcceptedAt: null,
      privacyPolicyVersion: null,
      phone: decoded.phone_number ?? null,
      phoneVerified: Boolean(decoded.phone_number),
      profile: null,
      selfieVerification: {
        selfieStoragePath: null,
        status: 'NOT_STARTED',
      },
      settings: defaultSettings(),
      trust: {
        score: 0,
        tier: 'NEW',
        verificationStatus: 'UNVERIFIED',
      },
      updatedAt: now,
      username: null,
      termsVersion: null,
    });
  } else {
    await reference.update({
      authProviders: [...providers],
      email: decoded.email ?? existing.get('email') ?? null,
      googleVerified: providers.has('google.com'),
      phone: decoded.phone_number ?? existing.get('phone') ?? null,
      phoneVerified:
        Boolean(decoded.phone_number) || Boolean(existing.get('phoneVerified')),
      updatedAt: now,
    });
  }

  const user = await reference.get();
  return documentToJson(user);
}

export function defaultSettings() {
  return {
    allowCircleContinuitySuggestions: true,
    notificationsEnabled: true,
    showInterestsInIcebreakers: true,
    showProfileInRecommendations: true,
  };
}

export function documentToJson(snapshot: DocumentSnapshot) {
  if (!snapshot.exists) return null;
  return toJson({ id: snapshot.id, ...snapshot.data() });
}

export function toJson(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        toJson(item),
      ]),
    );
  }
  return value;
}

export function assertObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'A JSON request body is required.');
  }
  return value as Record<string, unknown>;
}

export function requiredString(
  body: Record<string, unknown>,
  field: string,
  maxLength = 1000,
) {
  const value = body[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `${field} is too long.`);
  }
  return trimmed;
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
  maxLength = 1000,
) {
  const value = body[field];
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw new HttpError(400, `${field} is invalid.`);
  }
  return value.trim();
}

export function requiredBoolean(body: Record<string, unknown>, field: string) {
  if (typeof body[field] !== 'boolean') {
    throw new HttpError(400, `${field} must be true or false.`);
  }
  return body[field];
}

export function requiredNumber(
  body: Record<string, unknown>,
  field: string,
  minimum: number,
  maximum: number,
) {
  const value = body[field];
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new HttpError(
      400,
      `${field} must be between ${minimum} and ${maximum}.`,
    );
  }
  return value;
}

export function requiredStringArray(
  body: Record<string, unknown>,
  field: string,
  minimum: number,
  maximum: number,
) {
  const values = body[field];
  if (!Array.isArray(values)) {
    throw new HttpError(400, `${field} must be a list.`);
  }
  const normalized = [
    ...new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new HttpError(
      400,
      `${field} must contain ${minimum}-${maximum} items.`,
    );
  }
  return normalized;
}

export async function getRequiredDocument(collection: string, id: string) {
  const snapshot = await db.collection(collection).doc(id).get();
  if (!snapshot.exists) {
    throw new HttpError(404, `${collection.slice(0, -1)} was not found.`);
  }
  return snapshot;
}

export function randomId(collection: string) {
  return db.collection(collection).doc().id;
}

export function publicUser(data: DocumentData | undefined) {
  if (!data) return null;
  const profile = data.profile as Record<string, unknown> | null | undefined;
  return {
    displayName: data.displayName ?? profile?.displayName ?? null,
    id: data.id,
    profile: profile
      ? {
          bio: profile.bio ?? null,
          city: profile.city ?? null,
          interests: profile.interests ?? [],
          profilePhotoUrl: profile.profilePhotoUrl ?? null,
        }
      : null,
    trust: data.trust ?? null,
    username: data.username ?? null,
  };
}

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {},
  type = 'ACTIVITY_UPDATED',
) {
  const reference = db.collection('notifications').doc();
  await reference.set({
    body,
    createdAt: Timestamp.now(),
    id: reference.id,
    metadata,
    pushStatus: 'PENDING',
    readAt: null,
    title,
    type,
    userId,
  });
  return reference;
}

export async function countCollection(collection: string) {
  return (await db.collection(collection).count().get()).data().count;
}
