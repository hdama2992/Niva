import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Moon,
  Sun,
  TimerReset,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { resolveActivityPlanArtwork } from '../constants/activity-artwork';
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
  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState<PlanView>('upcoming');
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const week = useMemo(() => containingWeek(selectedDate), [selectedDate]);
  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => matchesView(item, view, today))
        .filter((item) =>
          view === 'upcoming'
            ? sameDay(activityTime(item), selectedDate)
            : true,
        )
        .sort(
          (left, right) =>
            activityTime(left).getTime() - activityTime(right).getTime(),
        ),
    [items, selectedDate, today, view],
  );
  const groupedItems = useMemo(
    () => groupByTimeOfDay(selectedItems),
    [selectedItems],
  );
  const pendingCount = items.filter(
    (item) => item.membershipStatus === 'REQUESTED',
  ).length;

  const content = (
    <>
      <Text style={styles.title}>{embedded ? 'Plans' : 'Your plans'}</Text>

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
        <Segment
          active={view === 'history'}
          label="History"
          onPress={() => setView('history')}
        />
      </View>

      {view === 'upcoming' ? (
        <>
          <View style={styles.dateHeadingRow}>
            <View style={styles.dateHeadingCopy}>
              <Text style={styles.dateEyebrow}>
                {selectedDate
                  .toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'long',
                    year: 'numeric',
                  })
                  .toUpperCase()}
              </Text>
              <Text style={styles.dateTitle}>
                {sameDay(selectedDate, today)
                  ? 'Today'
                  : formatSelectedDate(selectedDate)}
              </Text>
              <Text style={styles.dateCount}>
                {selectedItems.length}{' '}
                {selectedItems.length === 1 ? 'plan' : 'plans'} scheduled
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Choose a date"
              accessibilityRole="button"
              onPress={() => setCalendarOpen(true)}
              style={styles.calendarButton}
            >
              <CalendarDays color={colors.info} size={18} strokeWidth={2.3} />
              <Text style={styles.calendarButtonText}>Calendar</Text>
            </Pressable>
          </View>

          <View style={styles.weekStrip}>
            {week.map((date) => {
              const selected = sameDay(date, selectedDate);
              const hasPlan = items.some(
                (item) =>
                  matchesView(item, 'upcoming', today) &&
                  sameDay(activityTime(item), date),
              );
              return (
                <Pressable
                  accessibilityLabel={`${date.toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'long',
                  })}${hasPlan ? ', plan scheduled' : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={date.toISOString()}
                  onPress={() => setSelectedDate(startOfDay(date))}
                  style={styles.day}
                >
                  <Text
                    style={[styles.dayName, selected && styles.dayNameSelected]}
                  >
                    {date
                      .toLocaleDateString(undefined, { weekday: 'short' })
                      .toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.dayNumberWrap,
                      selected && styles.dayNumberActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        selected && styles.dayNumberTextActive,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  <View
                    style={[styles.planDot, !hasPlan && styles.planDotHidden]}
                  />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {groupedItems.length ? (
        <View style={styles.agenda}>
          {groupedItems.map((group) => (
            <View key={group.label} style={styles.timeGroup}>
              <View style={styles.timeGroupHeading}>
                {group.label === 'Morning' ? (
                  <Sun color={colors.warning} size={21} strokeWidth={2.2} />
                ) : (
                  <Moon color={colors.info} size={21} strokeWidth={2.2} />
                )}
                <Text style={styles.timeGroupTitle}>{group.label}</Text>
                <Text style={styles.timeGroupCount}>
                  {group.items.length}{' '}
                  {group.items.length === 1 ? 'plan' : 'plans'}
                </Text>
              </View>
              <View style={styles.agendaList}>
                {group.items.map((item) => (
                  <AgendaCard
                    compact={compact}
                    item={item}
                    key={`${item.id}:${item.occurrenceId ?? 'activity'}`}
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
        <EmptyPlans selectedDate={selectedDate} view={view} />
      )}

      <MonthPicker
        items={items}
        onClose={() => setCalendarOpen(false)}
        onSelect={(date) => {
          setSelectedDate(date);
          setCalendarOpen(false);
        }}
        selectedDate={selectedDate}
        setVisibleMonth={setVisibleMonth}
        today={today}
        visible={calendarOpen}
        visibleMonth={visibleMonth}
      />
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
      <ScrollView contentContainerStyle={styles.content}>{content}</ScrollView>
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
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
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
  const cancelled =
    item.membershipStatus === 'CANCELLED' ||
    item.activityStatus === 'CANCELLED';
  const past = activityTime(item).getTime() < Date.now();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(item)}
      style={styles.card}
    >
      <Image
        resizeMode="cover"
        source={resolveActivityPlanArtwork(item)}
        style={[styles.cardImage, compact && styles.cardImageCompact]}
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardTime}>
          {activityTime(item).toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <MapPin color={colors.muted} size={15} strokeWidth={2.2} />
          <Text numberOfLines={1} style={styles.metaText}>
            {item.location}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.statusRow}>
            {cancelled ? (
              <X color={colors.warning} size={15} strokeWidth={2.3} />
            ) : pending ? (
              <TimerReset color={colors.warning} size={15} strokeWidth={2.3} />
            ) : (
              <CheckCircle2
                color={colors.success}
                size={15}
                strokeWidth={2.3}
              />
            )}
            <Text
              style={[
                styles.statusText,
                (pending || cancelled) && styles.statusPending,
              ]}
            >
              {cancelled
                ? 'Cancelled'
                : pending
                  ? 'Request pending'
                  : past
                    ? 'Completed'
                    : 'You’re going'}
            </Text>
          </View>
          {approved && !past && !cancelled ? (
            <Pressable
              accessibilityLabel={`Open ${item.title} chat`}
              accessibilityRole="button"
              onPress={(event) => {
                event.stopPropagation();
                onChat(item);
              }}
              style={styles.chatButton}
            >
              <MessageCircle color={colors.info} size={18} strokeWidth={2.3} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </Pressable>
          ) : past && !cancelled && item.category === 'event' ? (
            <Pressable
              onPress={() => onFeedback(item)}
              style={styles.smallAction}
            >
              <Text style={styles.smallActionText}>Feedback</Text>
            </Pressable>
          ) : pending && !cancelled ? (
            <Pressable onPress={() => onLeave(item)} style={styles.smallAction}>
              <Text style={styles.smallActionText}>Withdraw</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function MonthPicker({
  items,
  onClose,
  onSelect,
  selectedDate,
  setVisibleMonth,
  today,
  visible,
  visibleMonth,
}: {
  items: DiscoveryItem[];
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date;
  setVisibleMonth: (date: Date) => void;
  today: Date;
  visible: boolean;
  visibleMonth: Date;
}) {
  const days = monthGrid(visibleMonth);
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.calendarModal}>
          <View style={styles.calendarModalHeader}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
              style={styles.monthButton}
            >
              <ChevronLeft color={colors.ink} size={21} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {visibleMonth.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
              style={styles.monthButton}
            >
              <ChevronRight color={colors.ink} size={21} strokeWidth={2.4} />
            </Pressable>
          </View>
          <View style={styles.calendarWeekdays}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.calendarWeekday}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {days.map((date) => {
              const outsideMonth = date.getMonth() !== visibleMonth.getMonth();
              const selected = sameDay(date, selectedDate);
              const hasPlan = items.some((item) =>
                sameDay(activityTime(item), date),
              );
              return (
                <Pressable
                  accessibilityLabel={`${date.toLocaleDateString()}${
                    hasPlan ? ', plan scheduled' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={date.toISOString()}
                  onPress={() => onSelect(startOfDay(date))}
                  style={styles.calendarDay}
                >
                  <View
                    style={[
                      styles.calendarDayNumber,
                      selected && styles.calendarDaySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        outsideMonth && styles.calendarDayOutside,
                        selected && styles.calendarDayTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.calendarPlanDot,
                      !hasPlan && styles.planDotHidden,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={styles.calendarModalFooter}>
            <Pressable
              onPress={() => onSelect(today)}
              style={styles.todayButton}
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Close calendar"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X color={colors.surface} size={18} strokeWidth={2.5} />
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmptyPlans({
  selectedDate,
  view,
}: {
  selectedDate: Date;
  view: PlanView;
}) {
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
        : [
            'No plans on this date',
            `Choose another date or explore something new after ${selectedDate.toLocaleDateString(
              undefined,
              {
                day: 'numeric',
                month: 'short',
              },
            )}.`,
          ];
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

function groupByTimeOfDay(items: DiscoveryItem[]) {
  const groups = new Map<string, DiscoveryItem[]>();
  items.forEach((item) => {
    const hour = activityTime(item).getHours();
    const label = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    groups.set(label, [...(groups.get(label) ?? []), item]);
  });
  return ['Morning', 'Afternoon', 'Evening']
    .filter((label) => groups.has(label))
    .map((label) => ({ items: groups.get(label) ?? [], label }));
}

function activityTime(item: DiscoveryItem) {
  return item.startsAt ? new Date(item.startsAt) : new Date(0);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameDay(left: Date, right: Date) {
  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function containingWeek(value: Date) {
  const start = startOfDay(value);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function monthGrid(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function addMonths(value: Date, amount: number) {
  return new Date(value.getFullYear(), value.getMonth() + amount, 1);
}

function formatSelectedDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

const styles = StyleSheet.create({
  agenda: { gap: spacing.xl },
  agendaList: { gap: spacing.md },
  back: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  calendarButton: {
    alignItems: 'center',
    borderColor: colors.info,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  calendarButtonText: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '800',
  },
  calendarDay: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    width: '14.285%',
  },
  calendarDayNumber: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  calendarDayOutside: { color: colors.border },
  calendarDaySelected: { backgroundColor: colors.primary },
  calendarDayText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '700',
  },
  calendarDayTextSelected: { color: colors.surface },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    width: '90%',
  },
  calendarModalFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  calendarModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarPlanDot: {
    backgroundColor: colors.info,
    borderRadius: radius.pill,
    height: 4,
    marginTop: 2,
    width: 4,
  },
  calendarWeekday: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    width: '14.285%',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 170,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardBody: { flex: 1, padding: spacing.md },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  cardImage: { backgroundColor: colors.accentSoft, width: '38%' },
  cardImageCompact: { width: 116 },
  cardTime: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 4,
  },
  chatButton: {
    alignItems: 'center',
    borderColor: colors.info,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  chatButtonText: { color: colors.info, fontSize: 12, fontWeight: '800' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  content: { padding: spacing.lg },
  dateCount: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  dateEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  dateHeadingCopy: { flex: 1 },
  dateHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  dateTitle: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  day: { alignItems: 'center', flex: 1, gap: 4, minHeight: 84 },
  dayName: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dayNameSelected: { color: colors.primary },
  dayNumber: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  dayNumberActive: { backgroundColor: colors.primary },
  dayNumberTextActive: { color: colors.surface },
  dayNumberWrap: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  embedded: { gap: spacing.lg },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  metaText: { color: colors.muted, flexShrink: 1, fontSize: typography.small },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(20,35,52,0.44)',
    flex: 1,
    justifyContent: 'center',
  },
  monthButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  monthTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  planDot: {
    backgroundColor: colors.info,
    borderRadius: radius.pill,
    height: 6,
    width: 6,
  },
  planDotHidden: { opacity: 0 },
  screen: { backgroundColor: colors.background, flex: 1 },
  segment: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.xs,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  segmentedControl: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  segmentText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  segmentTextActive: { color: colors.primaryDark },
  smallAction: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  smallActionText: { color: colors.info, fontSize: 12, fontWeight: '800' },
  statusPending: { color: colors.warning },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 4,
  },
  statusText: { color: colors.success, fontSize: 11, fontWeight: '800' },
  timeGroup: { gap: spacing.sm },
  timeGroupCount: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    color: colors.info,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 'auto',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  timeGroupHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeGroupTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  title: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  todayButton: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  todayButtonText: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '800',
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
  weekStrip: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
});
