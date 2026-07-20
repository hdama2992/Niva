import { defineSecret, defineString } from 'firebase-functions/params';

export const adminKey = defineSecret('NIVA_ADMIN_KEY');

export const allowedOrigins = defineString('ALLOWED_ORIGINS', {
  default: 'https://niva-staging.web.app,https://niva-staging.firebaseapp.com',
  description:
    'Comma-separated HTTPS origins allowed to call the Niva API from a browser.',
});
