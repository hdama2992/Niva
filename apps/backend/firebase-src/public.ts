import { Router } from 'express';
import {
  assertObject,
  asyncRoute,
  db,
  HttpError,
  requiredString,
  SUPPORTED_CITIES,
  Timestamp,
} from './core';

export const publicRouter = Router();

publicRouter.post(
  '/beta/access-requests',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    if (body.company) {
      response.json({ accepted: true });
      return;
    }
    const email = requiredString(body, 'email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'Enter a valid email address.');
    }
    const city = requiredString(body, 'city', 80);
    if (!SUPPORTED_CITIES.includes(city)) {
      throw new HttpError(400, 'Choose a city Niva currently supports.');
    }
    if (body.consent !== true) {
      throw new HttpError(400, 'Consent is required to join the waitlist.');
    }
    const interest = requiredString(body, 'interest', 80);
    const reference = db.collection('betaAccessRequests').doc(stableId(email));
    const existing = await reference.get();
    await reference.set(
      {
        city,
        createdAt: existing.get('createdAt') ?? Timestamp.now(),
        email,
        id: reference.id,
        interest,
        status: 'PENDING',
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
    response.json({ accepted: true });
  }),
);

publicRouter.post(
  '/account-deletion-requests',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    if (body.company) {
      response.json({ accepted: true });
      return;
    }
    const identifier = requiredString(body, 'identifier', 254).toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+\d{8,15}$/.test(identifier);
    if (!isEmail && !isPhone) {
      throw new HttpError(
        400,
        'Enter the email address or international phone number used for Niva.',
      );
    }
    const reference = db
      .collection('accountDeletionRequests')
      .doc(stableId(identifier));
    const existing = await reference.get();
    await reference.set(
      {
        createdAt: existing.get('createdAt') ?? Timestamp.now(),
        id: reference.id,
        identifier,
        status: 'PENDING',
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
    response.json({ accepted: true });
  }),
);

function stableId(input: string) {
  return Buffer.from(input).toString('base64url').slice(0, 500);
}
