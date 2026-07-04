const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export type NivaUser = {
  id: string;
  phone: string;
  name: string | null;
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
