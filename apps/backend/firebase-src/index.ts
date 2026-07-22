import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { app } from './app';
import { dispatchPendingPushNotifications } from './community';
import { adminKey } from './params';
import { cleanupExpiredVerificationSelfies } from './users';

export const api = onRequest(
  {
    cors: false,
    maxInstances: 20,
    memory: '512MiB',
    minInstances: 0,
    region: 'asia-south1',
    secrets: [adminKey],
    timeoutSeconds: 60,
  },
  app,
);

export const dispatchPushNotifications = onSchedule(
  {
    maxInstances: 1,
    memory: '256MiB',
    region: 'asia-south1',
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Kolkata',
    timeoutSeconds: 120,
  },
  async () => {
    const result = await dispatchPendingPushNotifications(200);
    console.info('Push notification dispatch complete', result);
  },
);

export const deleteExpiredVerificationSelfies = onSchedule(
  {
    maxInstances: 1,
    memory: '256MiB',
    region: 'asia-south1',
    schedule: '15 3 * * *',
    timeZone: 'Asia/Kolkata',
    timeoutSeconds: 300,
  },
  async () => {
    const result = await cleanupExpiredVerificationSelfies(500);
    console.info('Verification selfie cleanup complete', result);
  },
);
