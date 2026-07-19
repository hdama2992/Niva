import { validateEnvironment } from './environment';

const productionConfig = {
  NODE_ENV: 'production',
  ADMIN_ORIGIN: 'https://admin.niva.example',
  DATABASE_URL: 'postgresql://example',
  FIREBASE_CLIENT_EMAIL: 'firebase@example.invalid',
  FIREBASE_PRIVATE_KEY: 'private-key',
  FIREBASE_PROJECT_ID: 'niva-production',
  FIREBASE_STORAGE_BUCKET: 'niva-production.appspot.com',
  NIVA_ADMIN_KEY: 'recovery-key',
  NIVA_BETA_AUTH_ENABLED: 'false',
  WEBSITE_ORIGIN: 'https://niva.example',
};

describe('validateEnvironment', () => {
  it('allows local development without production credentials', () => {
    expect(validateEnvironment({ NODE_ENV: 'development' })).toEqual({
      NODE_ENV: 'development',
    });
  });

  it('accepts a complete production configuration', () => {
    expect(validateEnvironment(productionConfig)).toEqual(productionConfig);
  });

  it('rejects missing production credentials', () => {
    expect(() =>
      validateEnvironment({ ...productionConfig, FIREBASE_PRIVATE_KEY: '' }),
    ).toThrow('FIREBASE_PRIVATE_KEY');
  });

  it('rejects beta authentication in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionConfig,
        NIVA_BETA_AUTH_ENABLED: 'true',
      }),
    ).toThrow('must be false');
  });

  it('requires HTTPS browser origins in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionConfig,
        ADMIN_ORIGIN: 'http://admin.niva.example',
      }),
    ).toThrow('must use HTTPS');
  });
});
