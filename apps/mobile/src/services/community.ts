const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

type HttpMethod = 'GET' | 'PATCH' | 'POST' | 'PUT';

async function request<T>(
  path: string,
  idToken: string,
  options: { body?: unknown; method?: HttpMethod } = {},
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
    throw new Error(`Niva API request failed: ${path}`);
  }

  return (await response.json()) as T;
}

export type CommunityActivity = {
  _count?: { members: number };
  category?: 'event' | 'circle';
  city: string;
  capacity: number;
  description: string;
  difficulty: string;
  durationWeeks?: number;
  host?: { displayName: string | null; id: string; username: string | null };
  id: string;
  interests: string[];
  locationName: string;
  schedule?: string;
  startsAt: string;
  title: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function listEvents(idToken: string, city?: string) {
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  return request<{ events: CommunityActivity[] }>(
    `/community/events${query}`,
    idToken,
  );
}

export function listCircles(idToken: string, city?: string) {
  const query = city ? `?city=${encodeURIComponent(city)}` : '';
  return request<{ circles: CommunityActivity[] }>(
    `/community/circles${query}`,
    idToken,
  );
}

export function joinEvent(idToken: string, eventId: string) {
  return request(`/community/events/${eventId}/join`, idToken, {
    method: 'POST',
  });
}

export function leaveEvent(idToken: string, eventId: string) {
  return request(`/community/events/${eventId}/leave`, idToken, {
    method: 'POST',
  });
}

export function joinCircle(idToken: string, circleId: string) {
  return request(`/community/circles/${circleId}/join`, idToken, {
    method: 'POST',
  });
}

export function leaveCircle(idToken: string, circleId: string) {
  return request(`/community/circles/${circleId}/leave`, idToken, {
    method: 'POST',
  });
}

export function createEvent(
  idToken: string,
  event: {
    capacity: number;
    city: string;
    description: string;
    difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
    interests: string[];
    locationName: string;
    startsAt: string;
    title: string;
  },
) {
  return request<{ event: CommunityActivity }>('/community/events', idToken, {
    body: event,
    method: 'POST',
  });
}

export function listMyActivities(idToken: string) {
  return request<{
    circles: Array<{ circle: CommunityActivity }>;
    events: Array<{ event: CommunityActivity }>;
  }>('/community/me/activities', idToken);
}

export function listNotifications(idToken: string) {
  return request<{ notifications: NotificationItem[] }>(
    '/community/notifications',
    idToken,
  );
}

export function markNotificationRead(idToken: string, notificationId: string) {
  return request(`/community/notifications/${notificationId}/read`, idToken, {
    method: 'PATCH',
  });
}

export function blockUser(idToken: string, blockedUserId: string) {
  return request('/community/blocks', idToken, {
    body: { blockedUserId },
    method: 'POST',
  });
}

export function listBlocks(idToken: string) {
  return request('/community/blocks', idToken);
}

export function getSettings(idToken: string) {
  return request('/community/settings', idToken);
}

export function updateSettings(
  idToken: string,
  settings: {
    allowCircleContinuitySuggestions?: boolean;
    notificationsEnabled?: boolean;
    showProfileInRecommendations?: boolean;
  },
) {
  return request('/community/settings', idToken, {
    body: settings,
    method: 'PATCH',
  });
}

export function submitEventFeedback(
  idToken: string,
  eventId: string,
  feedback: { body?: string; rating: number },
) {
  return request(`/community/events/${eventId}/feedback`, idToken, {
    body: feedback,
    method: 'POST',
  });
}
