import { CURRENT_LEGAL_VERSION } from '../constants/legal';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiTrust = {
  score: number;
  tier: string;
  verificationStatus: string;
};

export type ApiUserProfile = {
  age?: number | null;
  ageRange?: string | null;
  bio?: string | null;
  city?: string | null;
  displayName?: string | null;
  interests?: string[];
  languages?: string[];
  occupation?: string | null;
  profilePhotoUrl?: string | null;
};

export type ApiSelfieVerification = {
  selfieStoragePath?: string | null;
  selfieUrl?: string | null;
  status: string;
};

export type ApiUser = {
  id: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  displayName: string | null;
  authProviders: string[];
  phoneVerified: boolean;
  googleVerified: boolean;
  legalAcceptedAt: string | null;
  privacyPolicyVersion: string | null;
  termsVersion: string | null;
  profile: ApiUserProfile | null;
  selfieVerification: ApiSelfieVerification | null;
  trust: ApiTrust | null;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  idToken: string;
  user: ApiUser;
};

export class NivaSessionUnavailableError extends Error {
  readonly code = 'niva/session-unavailable';

  constructor() {
    super('Niva could not finish creating the signed-in session.');
    this.name = 'NivaSessionUnavailableError';
  }
}

async function request<T>(
  path: string,
  idToken: string,
  options: { body?: unknown; method?: 'DELETE' | 'GET' | 'POST' | 'PUT' } = {},
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    method: options.method ?? 'GET',
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, 'Niva is unavailable right now.'),
    );
  }

  return (await response.json()) as T;
}

export async function createSession(idToken: string): Promise<ApiUser> {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/auth/session`, {
      body: JSON.stringify({ idToken }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  } catch {
    throw new NivaSessionUnavailableError();
  }

  if (!response.ok) {
    throw new NivaSessionUnavailableError();
  }

  const payload = (await response.json()) as { user: ApiUser };
  return payload.user;
}

export function getMe(idToken: string) {
  return request<{ user: ApiUser }>('/users/me', idToken);
}

export function deleteAccount(idToken: string) {
  return request<{ deleted: true }>('/users/me', idToken, {
    body: { confirmation: 'DELETE' },
    method: 'DELETE',
  });
}

export function setUsername(idToken: string, username: string) {
  return request<{ user: ApiUser }>('/users/me/username', idToken, {
    body: { username },
    method: 'POST',
  });
}

export function checkUsernameAvailability(idToken: string, username: string) {
  return request<{ available: boolean; username: string }>(
    `/users/me/username-availability?username=${encodeURIComponent(username)}`,
    idToken,
  );
}

export function updateProfile(
  idToken: string,
  profile: {
    age: number;
    bio: string;
    city: string;
    displayName: string;
    interests: string[];
    languages: string[];
    occupation?: string;
    profilePhotoUrl: string;
  },
) {
  return request<{ user: ApiUser }>('/users/me/profile', idToken, {
    body: profile,
    method: 'PUT',
  });
}

async function readErrorMessage(response: Response, fallback: string) {
  const rawMessage = await response.text();

  if (!rawMessage) {
    return fallback;
  }

  try {
    const payload = JSON.parse(rawMessage) as { message?: string | string[] };

    if (Array.isArray(payload.message)) {
      return payload.message.join(' ');
    }

    return payload.message || fallback;
  } catch {
    return rawMessage;
  }
}

export function acceptLegalDocuments(idToken: string) {
  return request<{ user: ApiUser }>('/users/me/legal-acceptance', idToken, {
    body: { accepted: true, version: CURRENT_LEGAL_VERSION },
    method: 'POST',
  });
}

export function submitSelfie(idToken: string, selfieStoragePath: string) {
  return request<{ user: ApiUser }>('/users/me/selfie', idToken, {
    body: { selfieStoragePath },
    method: 'POST',
  });
}
