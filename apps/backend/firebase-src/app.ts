import express from 'express';
import { adminRouter } from './admin';
import { communityRouter } from './community';
import {
  assertObject,
  asyncRoute,
  authenticate,
  corsMiddleware,
  errorHandler,
  HttpError,
  requiredString,
} from './core';
import { publicRouter } from './public';
import {
  createSession,
  requireCurrentLegalAcceptance,
  userRouter,
} from './users';

export const app = express();

app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use((request, _response, next) => {
  if (request.url === '/api' || request.url.startsWith('/api/')) {
    request.url = request.url.slice(4) || '/';
  }
  next();
});

app.get('/health', (_request, response) => {
  response.json({ service: 'niva-firebase-api', status: 'ok' });
});
app.get('/health/live', (_request, response) => {
  response.json({ status: 'ok' });
});
app.get('/health/ready', (_request, response) => {
  response.json({ database: 'firestore', status: 'ready' });
});

app.post(
  '/auth/session',
  asyncRoute(async (request, response) => {
    const body = assertObject(request.body);
    response.json({
      user: await createSession(requiredString(body, 'idToken', 8192)),
    });
  }),
);

app.use(publicRouter);
app.use('/users', authenticate, userRouter);
app.use(
  '/community',
  authenticate,
  requireCurrentLegalAcceptance,
  communityRouter,
);
app.use('/admin', authenticate, adminRouter);

app.use((_request, _response, next) => {
  next(new HttpError(404, 'API route not found.'));
});
app.use(errorHandler);
