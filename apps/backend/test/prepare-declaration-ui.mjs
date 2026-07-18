/** Prepare a deterministic beta account at the Community Promise step. */
const apiUrl = process.env.NIVA_TEST_API_URL ?? 'http://localhost:3001';
const phone = process.env.NIVA_TEST_PHONE ?? '+919876500519';
const token = `niva-beta:${phone}`;

async function request(path, method, body) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : undefined;
}

await fetch(`${apiUrl}/auth/session`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: token }),
});
await request('/users/me/username', 'POST', { username: 'promise_ui_0519' });
await request('/users/me/profile', 'PUT', {
  displayName: 'Ananya Rao',
  city: 'Bangalore',
  interests: ['Books', 'Photography', 'Wellness'],
  age: 28,
  languages: ['English', 'Kannada'],
  occupation: 'Product designer',
  bio: 'I enjoy quiet coffee shops, street photography, and thoughtful local plans.',
  profilePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
});
console.log(JSON.stringify({ phone, state: 'community-promise' }));
