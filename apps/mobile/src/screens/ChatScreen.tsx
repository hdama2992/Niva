import { ArrowLeft, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';
import {
  ChatMessage,
  listChatMessages,
  sendChatMessage,
} from '../services/community';
import { subscribeToCohortRealtime } from '../services/realtime';

type ChatScreenProps = {
  activity: DiscoveryItem;
  idToken: string;
  onBack: () => void;
  userId: string;
};

export function ChatScreen({
  activity,
  idToken,
  onBack,
  userId,
}: ChatScreenProps) {
  const [draft, setDraft] = useState('');
  const [activityNotice, setActivityNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const type = activity.category === 'circle' ? 'CIRCLE' : 'EVENT';
  const activityId = activity.remoteId ?? activity.id;

  const refresh = async () => {
    try {
      const payload = await listChatMessages(idToken, type, activityId);
      setMessages(payload.messages);
      setError(undefined);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load this cohort chat.',
      );
    } finally {
      setLoading(false);
    }
  };

  const upsertMessage = (message: ChatMessage) => {
    setMessages((current) =>
      current.some((existing) => existing.id === message.id)
        ? current
        : [...current, message],
    );
  };

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToCohortRealtime(idToken, type, activityId, {
      onActivityChange: () => {
        setActivityNotice(
          'Activity details changed. Return to details for the latest plan.',
        );
      },
      onConnectionChange: setLive,
      onMessage: upsertMessage,
    });

    return unsubscribe;
  }, [activityId, idToken, type]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) {
      return;
    }

    try {
      setSending(true);
      const payload = await sendChatMessage(idToken, type, activityId, body);
      upsertMessage(payload.message);
      setDraft('');
      setError(undefined);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to send that message.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={0}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onBack}
          style={styles.iconButton}
        >
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={styles.title}>
            {activity.title}
          </Text>
          <Text style={[styles.subtitle, live && styles.subtitleLive]}>
            {live ? 'Cohort chat - live' : 'Cohort chat'}
          </Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={styles.messages}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
        ref={scrollRef}
      >
        <View style={styles.boundary}>
          <Text style={styles.boundaryText}>
            This is a joined cohort space. No random direct messages.
          </Text>
        </View>
        {activityNotice ? (
          <Text style={styles.activityNotice}>{activityNotice}</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <ChatShimmer /> : null}
        {!loading && !messages.length && !error ? (
          <Text style={styles.emptyText}>
            Start with a quick hello or a practical question about the activity.
          </Text>
        ) : null}
        {!loading ? messages.map((message) => {
          const own = message.senderId === userId;
          return (
            <View
              key={message.id}
              style={[styles.messageRow, own && styles.messageRowOwn]}
            >
              <View style={[styles.message, own && styles.messageOwn]}>
                <Text style={[styles.sender, own && styles.senderOwn]}>
                  {own
                    ? 'You'
                    : (message.sender.displayName ??
                      message.sender.username ??
                      'Niva member')}
                </Text>
                <Text
                  style={[styles.messageText, own && styles.messageTextOwn]}
                >
                  {message.body}
                </Text>
              </View>
            </View>
          );
        }) : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          maxLength={500}
          multiline
          onChangeText={setDraft}
          onFocus={() =>
            requestAnimationFrame(() =>
              scrollRef.current?.scrollToEnd({ animated: true }),
            )
          }
          placeholder="Message the cohort"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={draft}
        />
        <Pressable
          accessibilityLabel="Send message"
          accessibilityRole="button"
          disabled={!draft.trim() || sending}
          onPress={() => void send()}
          style={[
            styles.sendButton,
            (!draft.trim() || sending) && styles.sendButtonDisabled,
          ]}
        >
          <Send color={colors.surface} size={19} strokeWidth={2.5} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatShimmer() {
  const opacity = useRef(new Animated.Value(0.38)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        opacity.setValue(0.58);
        return;
      }
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { duration: 720, toValue: 0.78, useNativeDriver: true }),
          Animated.timing(opacity, { duration: 720, toValue: 0.38, useNativeDriver: true }),
        ]),
      );
      animation.start();
    });
    return () => animation?.stop();
  }, [opacity]);

  return (
    <View accessibilityLabel="Loading cohort messages" style={styles.chatShimmer}>
      <Animated.View style={[styles.chatShimmerWide, { opacity }]} />
      <Animated.View style={[styles.chatShimmerShort, { opacity }]} />
      <Animated.View style={[styles.chatShimmerOwn, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  activityNotice: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  boundary: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  boundaryText: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  chatShimmer: { gap: spacing.sm, paddingVertical: spacing.sm },
  chatShimmerOwn: { alignSelf: 'flex-end', backgroundColor: colors.infoSoft, borderRadius: radius.md, height: 62, width: '68%' },
  chatShimmerShort: { backgroundColor: colors.surfaceStrong, borderRadius: radius.md, height: 52, width: '62%' },
  chatShimmerWide: { backgroundColor: colors.surfaceStrong, borderRadius: radius.md, height: 72, width: '82%' },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: Platform.OS === 'android' ? spacing.lg : spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    maxHeight: 112,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  message: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    maxWidth: '84%',
    padding: spacing.sm,
  },
  messageOwn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  messageRow: {
    alignItems: 'flex-start',
  },
  messageRowOwn: {
    alignItems: 'flex-end',
  },
  messageText: {
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: 3,
  },
  messageTextOwn: {
    color: colors.surface,
  },
  messages: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  sendButtonDisabled: {
    backgroundColor: colors.muted,
  },
  sender: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  senderOwn: {
    color: colors.surface,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  subtitleLive: {
    color: colors.secondary,
    fontWeight: '800',
  },
  title: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  titleWrap: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 60,
    paddingHorizontal: spacing.sm,
  },
});
