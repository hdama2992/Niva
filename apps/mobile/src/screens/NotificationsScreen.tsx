import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { NotificationItem } from '../services/community';

type NotificationsScreenProps = {
  notifications: NotificationItem[];
  onBack: () => void;
  onOpen: (notification: NotificationItem) => void;
};

export function NotificationsScreen({
  notifications,
  onBack,
  onOpen,
}: NotificationsScreenProps) {
  const unreadCount = notifications.filter(
    (notification) => !notification.readAt,
  ).length;

  return (
    <View style={styles.screen}>
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
        <Text style={styles.topBarTitle}>Notifications</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Your updates</Text>
            <Text style={styles.subtitle}>
              Verification, join requests, and event changes stay here.
            </Text>
          </View>
          {unreadCount ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount} new</Text>
            </View>
          ) : null}
        </View>

        {notifications.length ? (
          <View style={styles.list}>
            {notifications.map((notification) => {
              const unread = !notification.readAt;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={notification.id}
                  onPress={() => onOpen(notification)}
                  style={[
                    styles.notification,
                    unread && styles.notificationUnread,
                  ]}
                >
                  <View
                    style={[styles.iconWrap, unread && styles.iconWrapUnread]}
                  >
                    {unread ? (
                      <Bell
                        color={colors.primary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    ) : (
                      <CheckCircle2
                        color={colors.secondary}
                        size={20}
                        strokeWidth={2.4}
                      />
                    )}
                  </View>
                  <View style={styles.notificationCopy}>
                    <View style={styles.notificationHeading}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      {unread ? <View style={styles.dot} /> : null}
                    </View>
                    <Text style={styles.notificationBody}>
                      {notification.body}
                    </Text>
                    <Text style={styles.timestamp}>
                      {formatDate(notification.createdAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Bell color={colors.info} size={25} strokeWidth={2.3} />
            </View>
            <Text style={styles.emptyTitle}>Nothing new</Text>
            <Text style={styles.emptyText}>
              Once you take part in an activity, its updates will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  headingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconWrapUnread: {
    backgroundColor: colors.surfaceStrong,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  notification: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  notificationBody: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 3,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  notificationTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '800',
  },
  notificationUnread: {
    borderColor: colors.primary,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
    maxWidth: 276,
  },
  timestamp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  topBarSpacer: {
    height: 44,
    width: 44,
  },
  topBarTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  unreadBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unreadText: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '800',
  },
});
