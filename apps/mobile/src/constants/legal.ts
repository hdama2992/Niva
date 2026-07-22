export const CURRENT_LEGAL_VERSION = '2026-07-22';

const DEFAULT_POLICY_BASE_URL = 'https://niva-staging.web.app';

export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ??
  `${DEFAULT_POLICY_BASE_URL}/privacy`;
export const SUPPORT_URL =
  process.env.EXPO_PUBLIC_SUPPORT_URL ?? `${DEFAULT_POLICY_BASE_URL}/support`;
export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ?? `${DEFAULT_POLICY_BASE_URL}/terms`;
