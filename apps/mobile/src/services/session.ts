const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type NivaUser = {
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
  profile: unknown | null;
  selfieVerification: unknown | null;
  trust: unknown | null;
  createdAt: string;
  updatedAt: string;
};

export async function createSession(idToken: string): Promise<NivaUser> {
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

  const payload = (await response.json()) as { user: NivaUser };
  return payload.user;
}
