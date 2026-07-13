import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  Clock3,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';

type ActivityFilter = 'upcoming' | 'past' | 'cancelled';

type MyActivitiesScreenProps = {
  items: DiscoveryItem[];
  onBack: () => void;
  onFeedback: (item: DiscoveryItem) => void;
  onLeave: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
};

const filters: Array<{ id: ActivityFilter; label: string }> = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function MyActivitiesScreen({
  items,
  onBack,
  onFeedback,
  onLeave,
  onOpen,
}: MyActivitiesScreenProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>('upcoming');
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const cancelled =
          item.membershipStatus === 'CANCELLED' ||
          item.activityStatus === 'CANCELLED';
        const past = item.startsAt
          ? new Date(item.startsAt).getTime() < Date.now()
          : false;

        if (activeFilter === 'cancelled') {
          return cancelled;
        }

        if (activeFilter === 'past') {
          return !cancelled && past;
        }

        return !cancelled && !past;
      }),
    [activeFilter, items],
  );

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
        <Text style={styles.topBarTitle}>My plans</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.title}>Your activities</Text>
            <Text style={styles.subtitle}>
              Keep your upcoming commitments and membership requests in one
              place.
            </Text>
          </View>
          <View style={styles.count}>
            <Text style={styles.countValue}>{items.length}</Text>
            <Text style={styles.countLabel}>saved</Text>
          </View>
        </View>

        <View style={styles.segmentedControl}>
          {filters.map((filter) => (
            <Pressable
              accessibilityRole="button"
              key={filter.id}
              onPress={() => setActiveFilter(filter.id)}
              style={[
                styles.segment,
                activeFilter === filter.id && styles.segmentActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  activeFilter === filter.id && styles.segmentTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredItems.length ? (
          <View style={styles.list}>
            {filteredItems.map((item) => (
              <ActivityCard
                item={item}
                key={item.id}
                onFeedback={onFeedback}
                onLeave={onLeave}
                onOpen={onOpen}
              />
            ))}
          </View>
        ) : (
          <EmptyPlans filter={activeFilter} />
        )}
      </ScrollView>
    </View>
  );
}

function ActivityCard({
  item,
  onFeedback,
  onLeave,
  onOpen,
}: {
  item: DiscoveryItem;
  onFeedback: (item: DiscoveryItem) => void;
  onLeave: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
}) {
  const canLeave =
    item.membershipStatus === 'REQUESTED' ||
    item.membershipStatus === 'APPROVED';
  const canGiveFeedback =
    item.category === 'event' &&
    item.activityStatus !== 'CANCELLED' &&
    item.membershipStatus !== 'CANCELLED' &&
    Boolean(item.startsAt && new Date(item.startsAt).getTime() < Date.now());

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.category}>
          {item.category === 'circle' ? 'Circle' : 'Event'}
        </Text>
        <Text style={styles.status}>
          {item.activityStatus === 'CANCELLED'
            ? 'Activity cancelled'
            : formatStatus(item.membershipStatus)}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.detailRow}>
        <CalendarDays color={colors.primary} size={17} strokeWidth={2.3} />
        <Text style={styles.detailText}>{item.time}</Text>
      </View>
      <View style={styles.detailRow}>
        <Clock3 color={colors.secondary} size={17} strokeWidth={2.3} />
        <Text style={styles.detailText}>{item.location}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(item)}
          style={styles.detailAction}
        >
          <Text style={styles.detailActionText}>View details</Text>
        </Pressable>
        {canGiveFeedback ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onFeedback(item)}
            style={styles.feedbackAction}
          >
            <Text style={styles.feedbackActionText}>Give feedback</Text>
          </Pressable>
        ) : null}
        {canLeave ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onLeave(item)}
            style={styles.leaveAction}
          >
            <Text style={styles.leaveActionText}>
              {item.membershipStatus === 'REQUESTED' ? 'Withdraw' : 'Leave'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function EmptyPlans({ filter }: { filter: ActivityFilter }) {
  const copy =
    filter === 'cancelled'
      ? [
          'No cancelled activities',
          'Any activity you leave will be listed here.',
        ]
      : filter === 'past'
        ? [
            'No past activities yet',
            'Completed sessions will appear here after their start time.',
          ]
        : [
            'Nothing upcoming yet',
            'Explore a small event or circle when you are ready.',
          ];

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <CalendarCheck color={colors.info} size={25} strokeWidth={2.3} />
      </View>
      <Text style={styles.emptyTitle}>{copy[0]}</Text>
      <Text style={styles.emptyText}>{copy[1]}</Text>
    </View>
  );
}

function formatStatus(status: DiscoveryItem['membershipStatus']) {
  switch (status) {
    case 'APPROVED':
      return 'Going';
    case 'ATTENDED':
      return 'Attended';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'No-show';
    default:
      return 'Pending';
  }
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    lineHeight: 25,
    marginTop: spacing.sm,
  },
  category: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  count: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    minWidth: 62,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  countLabel: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
  },
  countValue: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  detailAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  detailActionText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  detailText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
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
    marginTop: spacing.lg,
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
  feedbackAction: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  feedbackActionText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
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
  leaveAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  leaveActionText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: colors.ink,
  },
  segmentedControl: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginTop: spacing.xl,
    padding: 4,
  },
  status: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
    maxWidth: 275,
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
});
