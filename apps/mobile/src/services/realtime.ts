import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from './community';

type CohortType = 'CIRCLE' | 'EVENT';

type CohortMessageEvent = {
  activityId: string;
  message: ChatMessage;
  type: CohortType;
};

type CohortActivityEvent = {
  activityId: string;
  type: CohortType;
};

type SubscriptionResponse = { error?: string; ok: boolean };

type CohortHandlers = {
  onActivityChange: () => void;
  onConnectionChange: (connected: boolean) => void;
  onMessage: (message: ChatMessage) => void;
};

const realtimeUrl =
  process.env.EXPO_PUBLIC_REALTIME_URL ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3001';

let activeToken: string | undefined;
let socket: Socket | undefined;

export function subscribeToCohortRealtime(
  idToken: string,
  type: CohortType,
  activityId: string,
  handlers: CohortHandlers,
) {
  const client = connectRealtime(idToken);
  const subscription = { activityId, type };

  const subscribe = () => {
    client
      .timeout(5000)
      .emit(
        'cohort:subscribe',
        subscription,
        (timeoutError: Error | null, response?: SubscriptionResponse) => {
          handlers.onConnectionChange(!timeoutError && response?.ok === true);
        },
      );
  };
  const onConnect = () => subscribe();
  const onDisconnect = () => handlers.onConnectionChange(false);
  const onMessage = (event: CohortMessageEvent) => {
    if (event.type === type && event.activityId === activityId) {
      handlers.onMessage(event.message);
    }
  };
  const onActivityChange = (event: CohortActivityEvent) => {
    if (event.type === type && event.activityId === activityId) {
      handlers.onActivityChange();
    }
  };

  client.on('connect', onConnect);
  client.on('disconnect', onDisconnect);
  client.on('cohort:message', onMessage);
  client.on('cohort:activity-updated', onActivityChange);
  client.on('cohort:activity-cancelled', onActivityChange);

  if (client.connected) {
    subscribe();
  }

  return () => {
    client.emit('cohort:unsubscribe', subscription);
    client.off('connect', onConnect);
    client.off('disconnect', onDisconnect);
    client.off('cohort:message', onMessage);
    client.off('cohort:activity-updated', onActivityChange);
    client.off('cohort:activity-cancelled', onActivityChange);
    handlers.onConnectionChange(false);
  };
}

export function subscribeToMemberRealtime(
  idToken: string,
  onUpdate: () => void,
) {
  const client = connectRealtime(idToken);
  const notify = () => onUpdate();

  client.on('notification:new', notify);
  client.on('activity:membership-updated', notify);

  return () => {
    client.off('notification:new', notify);
    client.off('activity:membership-updated', notify);
  };
}

export function disconnectRealtime() {
  socket?.disconnect();
  socket = undefined;
  activeToken = undefined;
}

function connectRealtime(idToken: string) {
  if (socket && activeToken === idToken) {
    if (!socket.active) {
      socket.connect();
    }
    return socket;
  }

  socket?.disconnect();
  activeToken = idToken;
  socket = io(realtimeUrl, {
    auth: { idToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 750,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  });

  return socket;
}
