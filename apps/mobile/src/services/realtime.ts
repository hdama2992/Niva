import {
  collection,
  doc,
  getFirestore,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import type { ChatMessage } from './community';

type CohortType = 'CIRCLE' | 'EVENT';

type CohortHandlers = {
  onActivityChange: () => void;
  onConnectionChange: (connected: boolean) => void;
  onMessage: (message: ChatMessage) => void;
};

export function subscribeToCohortRealtime(
  _idToken: string,
  type: CohortType,
  activityId: string,
  handlers: CohortHandlers,
) {
  const firestore = getFirestore();
  const threadId = `${type}_${activityId}`;
  let initialMessagesLoaded = false;

  const unsubscribeMessages = onSnapshot(
    query(
      collection(firestore, 'chatThreads', threadId, 'messages'),
      orderBy('createdAt', 'asc'),
      limitToLast(200),
    ),
    (snapshot) => {
      if (initialMessagesLoaded) {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          handlers.onMessage(toChatMessage(change.doc.id, change.doc.data()));
        });
      }
      initialMessagesLoaded = true;
      handlers.onConnectionChange(true);
    },
    () => handlers.onConnectionChange(false),
  );

  const unsubscribeActivity = onSnapshot(
    doc(firestore, 'chatThreads', threadId),
    () => {
      if (initialMessagesLoaded) handlers.onActivityChange();
    },
    () => handlers.onConnectionChange(false),
  );

  return () => {
    unsubscribeMessages();
    unsubscribeActivity();
    handlers.onConnectionChange(false);
  };
}

export function subscribeToMemberRealtime(
  _idToken: string,
  onUpdate: () => void,
) {
  const firestore = getFirestore();
  const currentUserId = getAuth().currentUser?.uid;
  if (!currentUserId) return () => undefined;
  let readySubscriptions = 0;
  const notifyAfterInitialLoad = () => {
    readySubscriptions += 1;
    if (readySubscriptions > 3) onUpdate();
  };
  const unsubscribes = [
    onSnapshot(
      query(
        collection(firestore, 'notifications'),
        where('userId', '==', currentUserId),
        orderBy('createdAt', 'desc'),
      ),
      notifyAfterInitialLoad,
    ),
    onSnapshot(
      query(
        collection(firestore, 'eventMembers'),
        where('userId', '==', currentUserId),
      ),
      notifyAfterInitialLoad,
    ),
    onSnapshot(
      query(
        collection(firestore, 'circleMembers'),
        where('userId', '==', currentUserId),
      ),
      notifyAfterInitialLoad,
    ),
  ];

  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}

export function disconnectRealtime() {
  // Firestore listeners are owned and disconnected by each returned unsubscribe.
}

function toChatMessage(id: string, data: Record<string, unknown>): ChatMessage {
  const timestamp = data.createdAt as { toDate?: () => Date } | undefined;
  return {
    body: String(data.body ?? ''),
    createdAt: timestamp?.toDate?.().toISOString() ?? new Date().toISOString(),
    id,
    sender: data.sender as ChatMessage['sender'],
    senderId: String(data.senderId ?? ''),
  };
}
