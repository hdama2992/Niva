import {
  Bell,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { resolveActivityCardArtwork } from '../constants/activity-artwork';
import { colors, radius, spacing, typography } from '../constants/theme';
import { NotificationItem } from '../services/community';

type NotificationsScreenProps = {
  notifications: NotificationItem[];
  onBack: () => void;
  onMarkAllRead?: () => void;
  onOpen: (notification: NotificationItem) => void;
};

export function NotificationsScreen({
  notifications,
  onBack,
  onMarkAllRead,
  onOpen,
}: NotificationsScreenProps) {
  const [filter, setFilter] = useState<'all' | 'action'>('all');
  const visible = useMemo(
    () =>
      filter === 'all' ? notifications : notifications.filter(needsAction),
    [filter, notifications],
  );
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const today = visible.filter((item) => isRecent(item.createdAt));
  const earlier = visible.filter((item) => !isRecent(item.createdAt));

  return (
    <View style={styles.screen}>
      <DeckTopBar
        onBack={onBack}
        right={
          onMarkAllRead && unreadCount ? (
            <Pressable accessibilityRole="button" onPress={onMarkAllRead}>
              <Text style={styles.markRead}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
        title="Updates"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segmented}>
          <FilterButton
            active={filter === 'all'}
            label={`All${unreadCount ? `  ${unreadCount}` : ''}`}
            onPress={() => setFilter('all')}
          />
          <FilterButton
            active={filter === 'action'}
            label="Needs action"
            onPress={() => setFilter('action')}
          />
        </View>

        {visible.length ? (
          <>
            {today.length ? (
              <NotificationGroup
                label={`Today · ${formatDay(new Date())}`}
                notifications={today}
                onOpen={onOpen}
              />
            ) : null}
            {earlier.length ? (
              <NotificationGroup
                label="Earlier"
                notifications={earlier}
                onOpen={onOpen}
              />
            ) : null}
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Bell color={colors.info} size={25} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'action'
                ? 'Nothing needs your attention'
                : 'Nothing new'}
            </Text>
            <Text style={styles.emptyText}>
              Verification, plan and membership updates will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilterButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.filterButton, active && styles.filterActive]}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function NotificationGroup({
  label,
  notifications,
  onOpen,
}: {
  label: string;
  notifications: NotificationItem[];
  onOpen: (item: NotificationItem) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      {notifications.map((item, index) => (
        <NotificationRow
          item={item}
          key={item.id}
          onOpen={() => onOpen(item)}
          showDivider={index > 0}
        />
      ))}
    </View>
  );
}

function NotificationRow({
  item,
  onOpen,
  showDivider,
}: {
  item: NotificationItem;
  onOpen: () => void;
  showDivider: boolean;
}) {
  const planRelated = Boolean(
    item.metadata?.eventId || item.metadata?.circleId,
  );
  const action = needsAction(item);
  const Icon = item.title.toLowerCase().includes('profile')
    ? ShieldCheck
    : item.title.toLowerCase().includes('reminder')
      ? CalendarCheck2
      : CheckCircle2;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={[styles.notification, showDivider && styles.notificationDivider]}
    >
      {!item.readAt ? (
        <View style={styles.unreadDot} />
      ) : (
        <View style={styles.dotSpacer} />
      )}
      {planRelated ? (
        <Image
          source={resolveActivityCardArtwork({
            interests: [],
            title: `${item.title} ${item.body}`,
          })}
          style={styles.thumbnail}
        />
      ) : (
        <View style={styles.iconWrap}>
          <Icon color={colors.success} size={23} />
        </View>
      )}
      <View style={styles.notificationCopy}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
      </View>
      {action ? (
        <Text style={styles.actionText}>Respond</Text>
      ) : planRelated ? (
        <View style={styles.viewPill}>
          <Text style={styles.viewText}>View plan</Text>
        </View>
      ) : (
        <ChevronRight color={colors.muted} size={20} />
      )}
    </Pressable>
  );
}

function needsAction(item: NotificationItem) {
  return (
    /needs|respond|pending|request|invited/i.test(
      `${item.title} ${item.body}`,
    ) && !/approved|received/i.test(`${item.title} ${item.body}`)
  );
}

function isRecent(value: string) {
  return Date.now() - new Date(value).getTime() < 24 * 60 * 60 * 1000;
}

function formatDay(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(value);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return isRecent(value)
    ? new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(date)
    : new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'short',
      }).format(date);
}

const styles = StyleSheet.create({
  actionText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '900',
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  dotSpacer: { width: 8 },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  filterActive: { backgroundColor: colors.primary },
  filterButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  filterText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '800',
  },
  filterTextActive: { color: colors.surface },
  group: { marginTop: spacing.xl },
  groupLabel: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  markRead: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  notification: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 108,
    paddingVertical: spacing.md,
  },
  notificationBody: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 3,
  },
  notificationCopy: { flex: 1 },
  notificationDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  notificationTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  segmented: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    flexDirection: 'row',
    padding: 3,
  },
  thumbnail: { borderRadius: radius.pill, height: 52, width: 52 },
  timestamp: { color: '#8B96A4', fontSize: 12, marginTop: spacing.xs },
  unreadDot: {
    backgroundColor: '#12528B',
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  viewPill: {
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  viewText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
});
