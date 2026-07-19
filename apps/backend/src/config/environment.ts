const productionRequiredVariables = [
  'ADMIN_ORIGIN',
  'DATABASE_URL',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'NIVA_ADMIN_KEY',
  'WEBSITE_ORIGIN',
] as const;

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (config.NODE_ENV !== 'production') {
    return config;
  }

  const missing = productionRequiredVariables.filter(
    (name) => typeof config[name] !== 'string' || !config[name].trim(),
  );
  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`,
    );
  }

  if (config.NIVA_BETA_AUTH_ENABLED === 'true') {
    throw new Error('NIVA_BETA_AUTH_ENABLED must be false in production.');
  }

  for (const name of ['ADMIN_ORIGIN', 'WEBSITE_ORIGIN'] as const) {
    const value = config[name] as string;
    if (!value.startsWith('https://')) {
      throw new Error(`${name} must use HTTPS in production.`);
    }
  }

  return config;
}
