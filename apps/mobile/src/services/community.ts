const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

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
    const message = await response.text();
    throw new Error(message || `Niva API request failed: ${path}`);
  }

  return (await response.json()) as T;
}

export type CommunityActivity = {
  _count?: { members: number };
  category?: 'event' | 'circle';
  city: string;
  capacity: number;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  description: string;
  difficulty: string;
  durationWeeks?: number;
  host?: { displayName: string | null; id: string; username: string | null };
  id: string;
  interests: string[];
  locationName: string;
  status?: 'CANCELLED' | 'COMPLETED' | 'DRAFT' | 'PUBLISHED';
  schedule?: string;
  startsAt: string;
  title: string;
};

export type CommunityMembership = {
  circle?: CommunityActivity;
  event?: CommunityActivity;
  id: string;
  joinedAt: string;
  status: 'REQUESTED' | 'APPROVED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type CommunitySettings = {
  allowCircleContinuitySuggestions: boolean;
  notificationsEnabled: boolean;
  showProfileInRecommendations: boolean;
};

export type ChatMessage = {
  body: string;
  createdAt: string;
  id: string;
  sender: { displayName: string | null; id: string; username: string | null };
  senderId: string;
};

export type HostApproval = {
  reason: string | null;
  requestedAt: string | null;
  reviewedAt: string | null;
  status: 'APPROVED' | 'NOT_REQUESTED' | 'PENDING' | 'REJECTED';
  userId: string;
};

export type EventMember = {
  id: string;
  status: 'APPROVED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW' | 'REQUESTED';
  user: {
    displayName: string | null;
    id: string;
    profile: { interests: string[] } | null;
    username: string | null;
  };
};

export type CircleMember = EventMember;

export type BlockedUser = {
  blocked: {
    displayName: string | null;
    id: string;
    username: string | null;
  };
  blockedId: string;
  id: string;
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

export function createCircle(
  idToken: string,
  circle: {
    capacity: number;
    city: string;
    description: string;
    difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
    durationWeeks: number;
    interests: string[];
    locationName: string;
    schedule: string;
    startsAt: string;
    title: string;
  },
) {
  return request<{ circle: CommunityActivity }>('/community/circles', idToken, {
    body: circle,
    method: 'POST',
  });
}

export function updateEvent(
  idToken: string,
  eventId: string,
  event: Partial<{
    capacity: number;
    city: string;
    description: string;
    difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
    interests: string[];
    locationName: string;
    startsAt: string;
    title: string;
  }>,
) {
  return request<{ event: CommunityActivity }>(`/community/events/${eventId}`, idToken, {
    body: event,
    method: 'PATCH',
  });
}

export function updateCircle(
  idToken: string,
  circleId: string,
  circle: Partial<{
    capacity: number;
    city: string;
    description: string;
    difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
    durationWeeks: number;
    interests: string[];
    locationName: string;
    schedule: string;
    startsAt: string;
    title: string;
  }>,
) {
  return request<{ circle: CommunityActivity }>(
    `/community/circles/${circleId}`,
    idToken,
    { body: circle, method: 'PATCH' },
  );
}

export function cancelEvent(idToken: string, eventId: string, reason: string) {
  return request<{ event: CommunityActivity }>(
    `/community/events/${eventId}/cancel`,
    idToken,
    { body: { reason }, method: 'POST' },
  );
}

export function cancelCircle(
  idToken: string,
  circleId: string,
  reason: string,
) {
  return request<{ circle: CommunityActivity }>(
    `/community/circles/${circleId}/cancel`,
    idToken,
    { body: { reason }, method: 'POST' },
  );
}

export function getHostApproval(idToken: string) {
  return request<{ approval: HostApproval | null }>(
    '/community/host-approval',
    idToken,
  );
}

export function requestHostApproval(idToken: string) {
  return request<{ approval: HostApproval }>('/community/host-approval/request', idToken, {
    method: 'POST',
  });
}

export function listMyActivities(idToken: string) {
  return request<{
    circles: CommunityMembership[];
    events: CommunityMembership[];
  }>('/community/me/activities', idToken);
}

export function listNotifications(idToken: string) {
  return request<{ notifications: NotificationItem[] }>(
    '/community/notifications',
    idToken,
  );
}

export function markNotificationRead(idToken: string, notificationId: string) {
  return request<{ notification: NotificationItem }>(
    `/community/notifications/${notificationId}/read`,
    idToken,
    { method: 'PATCH' },
  );
}

export function listChatMessages(
  idToken: string,
  type: 'CIRCLE' | 'EVENT',
  activityId: string,
) {
  return request<{ messages: ChatMessage[] }>(
    `/community/chats/${type}/${activityId}/messages`,
    idToken,
  );
}

export function sendChatMessage(
  idToken: string,
  type: 'CIRCLE' | 'EVENT',
  activityId: string,
  body: string,
) {
  return request<{ message: ChatMessage }>(
    `/community/chats/${type}/${activityId}/messages`,
    idToken,
    { body: { body }, method: 'POST' },
  );
}

export function reportUser(
  idToken: string,
  report: {
    circleId?: string;
    details?: string;
    eventId?: string;
    reason:
      | 'FAKE_PROFILE'
      | 'HARASSMENT'
      | 'INAPPROPRIATE_BEHAVIOUR'
      | 'OTHER'
      | 'SPAM';
    reportedUserId?: string;
  },
) {
  return request('/community/reports', idToken, {
    body: report,
    method: 'POST',
  });
}

export function blockUser(idToken: string, blockedUserId: string) {
  return request('/community/blocks', idToken, {
    body: { blockedUserId },
    method: 'POST',
  });
}

export function listBlocks(idToken: string) {
  return request<{ blocks: BlockedUser[] }>('/community/blocks', idToken);
}

export function unblockUser(idToken: string, blockedUserId: string) {
  return request(`/community/blocks/${blockedUserId}`, idToken, {
    method: 'DELETE',
  });
}

export function getSettings(idToken: string) {
  return request<{ settings: CommunitySettings }>(
    '/community/settings',
    idToken,
  );
}

export function updateSettings(
  idToken: string,
  settings: {
    allowCircleContinuitySuggestions?: boolean;
    notificationsEnabled?: boolean;
    showProfileInRecommendations?: boolean;
  },
) {
  return request<{ settings: CommunitySettings }>(
    '/community/settings',
    idToken,
    {
      body: settings,
      method: 'PATCH',
    },
  );
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

export function listEventMembers(idToken: string, eventId: string) {
  return request<{ members: EventMember[] }>(
    `/community/events/${eventId}/members`,
    idToken,
  );
}

export function updateEventMembership(
  idToken: string,
  eventId: string,
  memberId: string,
  status: 'APPROVED' | 'CANCELLED',
) {
  return request(`/community/events/${eventId}/members/${memberId}`, idToken, {
    body: { status },
    method: 'PATCH',
  });
}

export function updateEventAttendance(
  idToken: string,
  eventId: string,
  memberId: string,
  status: 'ATTENDED' | 'NO_SHOW',
) {
  return request(
    `/community/events/${eventId}/members/${memberId}/attendance`,
    idToken,
    { body: { status }, method: 'PATCH' },
  );
}

export function listCircleMembers(idToken: string, circleId: string) {
  return request<{ members: CircleMember[] }>(
    `/community/circles/${circleId}/members`,
    idToken,
  );
}

export function updateCircleMembership(
  idToken: string,
  circleId: string,
  memberId: string,
  status: 'APPROVED' | 'CANCELLED',
) {
  return request(`/community/circles/${circleId}/members/${memberId}`, idToken, {
    body: { status },
    method: 'PATCH',
  });
}
