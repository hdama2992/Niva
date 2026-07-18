import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  MapPin,
  MessageCircle,
  TimerReset,
} from 'lucide-react-native';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';

import { resolveActivityCardArtwork } from '../constants/activity-artwork';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';

type PlanView = 'history' | 'pending' | 'upcoming';

type MyActivitiesScreenProps = {
  items: DiscoveryItem[];
  embedded?: boolean;
  onBack?: () => void;
  onChat: (item: DiscoveryItem) => void;
  onFeedback: (item: DiscoveryItem) => void;
  onLeave: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
};

export function MyActivitiesScreen({
  embedded = false,
  items,
  onBack,
  onChat,
  onFeedback,
  onLeave,
  onOpen,
}: MyActivitiesScreenProps) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [view, setView] = useState<PlanView>('upcoming');
  const today = useMemo(() => startOfDay(new Date()), []);
  const week = useMemo(() => currentWeek(today), [today]);
  const filtered = useMemo(
    () =>
      items
        .filter((item) => matchesView(item, view, today))
        .sort(
          (left, right) =>
            activityTime(left).getTime() - activityTime(right).getTime(),
        ),
    [items, today, view],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const pendingCount = items.filter(
    (item) => item.membershipStatus === 'REQUESTED',
  ).length;
  const todayHasPlan = items.some(
    (item) => startOfDay(activityTime(item)).getTime() === today.getTime(),
  );

  const content = (
    <>
      <View style={styles.headingRow}>
        <Text style={styles.title}>{embedded ? 'Plans' : 'Your plans'}</Text>
        <CalendarDays color={colors.primary} size={28} strokeWidth={2.3} />
      </View>

      <View style={styles.viewRow}>
        <View style={styles.segmentedControl}>
          <Segment
            active={view === 'upcoming'}
            label="Upcoming"
            onPress={() => setView('upcoming')}
          />
          <Segment
            active={view === 'pending'}
            label={`Pending${pendingCount ? ` ${pendingCount}` : ''}`}
            onPress={() => setView('pending')}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setView('history')}
          style={styles.historyAction}
        >
          <History
            color={view === 'history' ? colors.primary : colors.info}
            size={19}
            strokeWidth={2.3}
          />
          <Text
            style={[
              styles.historyText,
              view === 'history' && styles.historyTextActive,
            ]}
          >
            History
          </Text>
        </Pressable>
      </View>

      <View style={styles.weekStrip}>
        {week.map((date) => {
          const active = date.getTime() === today.getTime();
          const hasPlan = items.some(
            (item) =>
              startOfDay(activityTime(item)).getTime() === date.getTime(),
          );
          return (
            <View key={date.toISOString()} style={styles.day}>
              <Text style={styles.dayName}>
                {date
                  .toLocaleDateString(undefined, { weekday: 'short' })
                  .toUpperCase()}
              </Text>
              <View
                style={[styles.dayNumberWrap, active && styles.dayNumberActive]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    active && styles.dayNumberTextActive,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
              {active ? (
                <Text style={styles.todayLabel}>Today</Text>
              ) : hasPlan ? (
                <View style={styles.planDot} />
              ) : (
                <View style={styles.dotSpacer} />
              )}
            </View>
          );
        })}
      </View>

      {view === 'upcoming' && !todayHasPlan ? (
        <View style={styles.todayEmpty}>
          <Clock3 color={colors.info} size={20} strokeWidth={2.2} />
          <Text style={styles.todayEmptyText}>
            Nothing planned today · Enjoy your day
          </Text>
        </View>
      ) : null}

      {groups.length ? (
        <View style={styles.timeline}>
          <View style={styles.timelineLine} />
          {groups.map((group) => (
            <View key={group.key} style={styles.dayGroup}>
              <View style={styles.groupHeading}>
                <View style={styles.timelineNode} />
                <Text style={styles.groupTitle}>{group.label}</Text>
              </View>
              <View style={styles.groupItems}>
                {group.items.map((item) => (
                  <AgendaCard
                    compact={compact}
                    item={item}
                    key={item.id}
                    onChat={onChat}
                    onFeedback={onFeedback}
                    onLeave={onLeave}
                    onOpen={onOpen}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptyPlans view={view} />
      )}
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{content}</View>;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={onBack}
          style={styles.back}
        >
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topBarTitle}>Plans</Text>
        <View style={styles.back} />
      </View>
      <View style={styles.content}>{content}</View>
    </View>
  );
}

function Segment({
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
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AgendaCard({
  compact,
  item,
  onChat,
  onFeedback,
  onLeave,
  onOpen,
}: {
  compact: boolean;
  item: DiscoveryItem;
  onChat: (item: DiscoveryItem) => void;
  onFeedback: (item: DiscoveryItem) => void;
  onLeave: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
}) {
  const approved =
    item.membershipStatus === 'APPROVED' ||
    item.membershipStatus === 'ATTENDED';
  const pending = item.membershipStatus === 'REQUESTED';
  const past = activityTime(item).getTime() < Date.now();
  const recurring = item.category === 'circle' && item.occurrenceId;

  return (
    <Pressable
      onPress={() => onOpen(item)}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <Image
        resizeMode="cover"
        source={resolveActivityCardArtwork(item)}
        style={[styles.cardImage, compact && styles.cardImageCompact]}
      />
      <View style={[styles.cardBody, compact && styles.cardBodyCompact]}>
        <View style={styles.cardTypeRow}>
          <Text style={styles.cardType}>
            {recurring ? 'RECURRING' : 'PLAN'}
          </Text>
          {recurring ? (
            <TimerReset color={colors.secondary} size={15} strokeWidth={2.3} />
          ) : null}
        </View>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Clock3 color={colors.warning} size={16} strokeWidth={2.3} />
          <Text style={styles.metaText}>
            {activityTime(item).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin color={colors.info} size={16} strokeWidth={2.3} />
          <Text numberOfLines={1} style={styles.metaText}>
            {item.location}
          </Text>
        </View>
        <View style={[styles.cardFooter, compact && styles.cardFooterCompact]}>
          <View style={styles.statusRow}>
            {pending ? (
              <TimerReset color={colors.warning} size={16} strokeWidth={2.3} />
            ) : (
              <CheckCircle2
                color={colors.success}
                size={16}
                strokeWidth={2.3}
              />
            )}
            <Text style={[styles.statusText, pending && styles.statusPending]}>
              {pending
                ? 'Request pending'
                : past
                  ? 'Completed'
                  : 'You’re going'}
            </Text>
          </View>
          {approved && !past ? (
            <Pressable onPress={() => onChat(item)} style={styles.quickAction}>
              <MessageCircle color={colors.info} size={16} strokeWidth={2.3} />
              <Text style={styles.quickActionText}>Chat</Text>
            </Pressable>
          ) : past && item.category === 'event' ? (
            <Pressable
              onPress={() => onFeedback(item)}
              style={styles.quickAction}
            >
              <Text style={styles.quickActionText}>Feedback</Text>
            </Pressable>
          ) : pending ? (
            <Pressable onPress={() => onLeave(item)} style={styles.quickAction}>
              <Text style={styles.quickActionText}>Withdraw</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function EmptyPlans({ view }: { view: PlanView }) {
  const copy =
    view === 'pending'
      ? [
          'No pending requests',
          'Plans awaiting a host decision will appear here.',
        ]
      : view === 'history'
        ? [
            'No plan history yet',
            'Completed and cancelled plans will stay here.',
          ]
        : ['Nothing upcoming yet', 'Explore a plan when you are ready.'];
  return (
    <View style={styles.empty}>
      <CalendarDays color={colors.info} size={28} strokeWidth={2.2} />
      <Text style={styles.emptyTitle}>{copy[0]}</Text>
      <Text style={styles.emptyText}>{copy[1]}</Text>
    </View>
  );
}

function matchesView(item: DiscoveryItem, view: PlanView, today: Date) {
  const cancelled =
    item.membershipStatus === 'CANCELLED' ||
    item.activityStatus === 'CANCELLED';
  const past = activityTime(item).getTime() < today.getTime();
  if (view === 'pending')
    return !cancelled && item.membershipStatus === 'REQUESTED';
  if (view === 'history') return cancelled || past;
  return !cancelled && !past && item.membershipStatus !== 'REQUESTED';
}

function groupByDay(items: DiscoveryItem[]) {
  const groups = new Map<string, DiscoveryItem[]>();
  items.forEach((item) => {
    const key = startOfDay(activityTime(item)).toISOString();
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return [...groups.entries()].map(([key, grouped]) => ({
    items: grouped,
    key,
    label: new Date(key).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      weekday: 'long',
    }),
  }));
}

function activityTime(item: DiscoveryItem) {
  return item.startsAt ? new Date(item.startsAt) : new Date(0);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function currentWeek(today: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

const styles = StyleSheet.create({
  back: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 174,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardBody: { flex: 1, padding: spacing.md },
  cardBodyCompact: { padding: spacing.sm },
  cardCompact: { minHeight: 160 },
  cardFooter: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  cardFooterCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  cardImage: { backgroundColor: colors.accentSoft, height: '100%', width: 122 },
  cardImageCompact: { width: 94 },
  cardTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  cardType: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTypeRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  content: { padding: spacing.lg },
  day: { alignItems: 'center', flex: 1, gap: 4 },
  dayGroup: { gap: spacing.sm, marginBottom: spacing.lg },
  dayName: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  dayNumber: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
  },
  dayNumberActive: { backgroundColor: colors.primary },
  dayNumberTextActive: { color: colors.surface },
  dayNumberWrap: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  dotSpacer: { height: 11 },
  embedded: { gap: spacing.lg },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.small,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  groupHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  groupItems: { gap: spacing.md, marginLeft: spacing.xl },
  groupTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '800',
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
  },
  historyText: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '800',
  },
  historyTextActive: { color: colors.primary },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  metaText: { color: colors.muted, flexShrink: 1, fontSize: typography.small },
  planDot: {
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  quickAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  quickActionText: { color: colors.info, fontSize: 12, fontWeight: '800' },
  screen: { backgroundColor: colors.background, flex: 1 },
  segment: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentedControl: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    padding: 4,
  },
  segmentText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  segmentTextActive: { color: colors.surface },
  statusPending: { color: colors.warning },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  statusText: { color: colors.success, fontSize: 12, fontWeight: '800' },
  timeline: { position: 'relative' },
  timelineLine: {
    backgroundColor: colors.border,
    bottom: 12,
    left: 8,
    position: 'absolute',
    top: 12,
    width: 1,
  },
  timelineNode: {
    backgroundColor: colors.primary,
    borderColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 4,
    height: 18,
    width: 18,
  },
  title: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  todayEmpty: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  todayEmptyText: { color: colors.muted, fontSize: typography.small },
  todayLabel: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    color: colors.warning,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  topBar: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing.sm,
  },
  topBarTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  viewRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  weekStrip: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
});
