const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiTrust = {
  score: number;
  tier: string;
  verificationStatus: string;
};

export type ApiUserProfile = {
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
  selfDeclarationAccepted: boolean;
  selfDeclarationAcceptedAt: string | null;
  selfDeclarationVersion: string | null;
  communityGuidelinesAccepted: boolean;
  communityGuidelinesAcceptedAt: string | null;
  communityGuidelinesVersion: string | null;
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

async function request<T>(
  path: string,
  idToken: string,
  options: { body?: unknown; method?: 'GET' | 'POST' | 'PUT' } = {},
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
    const message = await response.text();
    throw new Error(message || 'Unable to reach Niva backend.');
  }

  return (await response.json()) as T;
}

export async function createSession(idToken: string): Promise<ApiUser> {
  const response = await fetch(`${apiUrl}/auth/session`, {
    body: JSON.stringify({ idToken }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Unable to create a Niva session.');
  }

  const payload = (await response.json()) as { user: ApiUser };
  return payload.user;
}

export async function exchangePnvToken(pnvToken: string): Promise<string> {
  const response = await fetch(`${apiUrl}/auth/pnv/exchange`, {
    body: JSON.stringify({ pnvToken }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || 'Unable to verify the phone number from this device.',
    );
  }

  const payload = (await response.json()) as { customToken: string };
  return payload.customToken;
}

export async function createBetaSession(phone: string): Promise<Session> {
  const idToken = `niva-beta:${phone}`;
  const user = await createSession(idToken);

  return { idToken, user };
}

export function getMe(idToken: string) {
  return request<{ user: ApiUser }>('/users/me', idToken);
}

export function setUsername(idToken: string, username: string) {
  return request<{ user: ApiUser }>('/users/me/username', idToken, {
    body: { username },
    method: 'POST',
  });
}

export function updateProfile(
  idToken: string,
  profile: {
    ageRange?: string;
    bio?: string;
    city: string;
    displayName: string;
    interests: string[];
    languages: string[];
    occupation?: string;
    profilePhotoUrl?: string;
  },
) {
  return request<{ user: ApiUser }>('/users/me/profile', idToken, {
    body: profile,
    method: 'PUT',
  });
}

export function acceptSelfDeclaration(idToken: string) {
  return request<{ user: ApiUser }>('/users/me/self-declaration', idToken, {
    body: { accepted: true, version: 'v1' },
    method: 'POST',
  });
}

export function acceptCommunityGuidelines(idToken: string) {
  return request<{ user: ApiUser }>('/users/me/community-guidelines', idToken, {
    body: { accepted: true, version: 'v1' },
    method: 'POST',
  });
}

export function submitSelfie(idToken: string, selfieStoragePath: string) {
  return request<{ user: ApiUser }>('/users/me/selfie', idToken, {
    body: { selfieStoragePath },
    method: 'POST',
  });
}
