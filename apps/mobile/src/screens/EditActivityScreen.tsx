import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleMinus,
  CirclePlus,
  Clock3,
  MapPin,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';
import { NivaUser } from '../types/niva';

export type ActivityEditInput = {
  capacity: number;
  description: string;
  difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
  durationWeeks?: number;
  interests: string[];
  locationName: string;
  schedule?: string;
  startsAt: string;
  title: string;
};

type EditActivityScreenProps = {
  activity: DiscoveryItem;
  onBack: () => void;
  onCancel: (reason: string) => Promise<void>;
  onSave: (input: ActivityEditInput) => Promise<void>;
  user: NivaUser;
};

const difficulties: ActivityEditInput['difficulty'][] = [
  'SOCIAL',
  'BEGINNER',
  'EASY',
  'FOCUSED',
];

export function EditActivityScreen({
  activity,
  onBack,
  onCancel,
  onSave,
  user,
}: EditActivityScreenProps) {
  const isCircle = activity.category === 'circle';
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.summary);
  const [locationName, setLocationName] = useState(activity.location);
  const [startsAt, setStartsAt] = useState(
    activity.startsAt ? new Date(activity.startsAt) : new Date(),
  );
  const [schedule, setSchedule] = useState(activity.schedule ?? activity.time);
  const [capacity, setCapacity] = useState(activity.capacity ?? 6);
  const [durationWeeks, setDurationWeeks] = useState(
    Number.parseInt(activity.duration ?? '6', 10) || 6,
  );
  const [difficulty, setDifficulty] = useState<ActivityEditInput['difficulty']>(
    difficultyValue(activity.difficulty),
  );
  const [interests, setInterests] = useState(activity.interests);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((value) => value !== interest)
        : [...current, interest],
    );
  };

  const save = async () => {
    if (!title.trim() || !description.trim() || !locationName.trim()) {
      setError('Add a title, description, and clear meeting location.');
      return;
    }
    if (isCircle && !schedule.trim()) {
      setError('Add the recurring schedule for this circle.');
      return;
    }
    if (!interests.length) {
      setError('Choose at least one interest for discovery.');
      return;
    }

    try {
      setSaving(true);
      setError(undefined);
      await onSave({
        capacity,
        description: description.trim(),
        difficulty,
        durationWeeks: isCircle ? durationWeeks : undefined,
        interests,
        locationName: locationName.trim(),
        schedule: isCircle ? schedule.trim() : undefined,
        startsAt: startsAt.toISOString(),
        title: title.trim(),
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to update this activity.',
      );
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (cancellationReason.trim().length < 3) {
      setError('Add a short reason so members know what happened.');
      return;
    }

    try {
      setCancelling(true);
      setError(undefined);
      await onCancel(cancellationReason.trim());
    } catch (cancelError) {
      setError(
        cancelError instanceof Error ? cancelError.message : 'Unable to cancel this activity.',
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={10} onPress={onBack} style={styles.iconButton}>
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text numberOfLines={1} style={styles.topBarTitle}>Edit {isCircle ? 'circle' : 'event'}</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Keep members in the loop</Text>
        <Text style={styles.subtitle}>Saving updates the live activity and notifies members with a pending or approved place.</Text>
        <Field label="Title"><TextInput onChangeText={setTitle} style={styles.input} value={title} /></Field>
        <Field label="Description"><TextInput multiline onChangeText={setDescription} style={[styles.input, styles.textArea]} textAlignVertical="top" value={description} /></Field>
        <Field label="Meeting location"><View style={styles.locationInput}><MapPin color={colors.secondary} size={19} strokeWidth={2.3} /><TextInput onChangeText={setLocationName} style={styles.locationTextInput} value={locationName} /></View></Field>
        <ScheduleControl value={startsAt} onChange={setStartsAt} />
        {isCircle ? <Field label="Recurring schedule"><TextInput onChangeText={setSchedule} placeholder="Every Saturday, 10:00 AM" placeholderTextColor={colors.muted} style={styles.input} value={schedule} /></Field> : null}
        {isCircle ? <Stepper label="Circle length" value={`${durationWeeks} weeks`} decreaseDisabled={durationWeeks <= 2} onDecrease={() => setDurationWeeks((value) => Math.max(2, value - 1))} onIncrease={() => setDurationWeeks((value) => Math.min(16, value + 1))} /> : null}
        <Stepper label="Member capacity" value={`${capacity} members`} decreaseDisabled={capacity <= 2} onDecrease={() => setCapacity((value) => Math.max(2, value - 1))} onIncrease={() => setCapacity((value) => Math.min(isCircle ? 16 : 20, value + 1))} />
        <Field label="Activity style"><View style={styles.choiceList}>{difficulties.map((option) => <Pressable accessibilityRole="button" key={option} onPress={() => setDifficulty(option)} style={[styles.choice, difficulty === option && styles.choiceSelected]}><Text style={[styles.choiceText, difficulty === option && styles.choiceTextSelected]}>{formatDifficulty(option)}</Text></Pressable>)}</View></Field>
        <Field label="Interests"><View style={styles.choiceList}>{user.interests.map((interest) => <Pressable accessibilityRole="button" key={interest} onPress={() => toggleInterest(interest)} style={[styles.choice, interests.includes(interest) && styles.choiceSelected]}><Text style={[styles.choiceText, interests.includes(interest) && styles.choiceTextSelected]}>{interest}</Text></Pressable>)}</View></Field>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={saving || cancelling} onPress={() => void save()} style={[styles.saveButton, (saving || cancelling) && styles.disabled]}><Text style={styles.saveText}>{saving ? 'Saving...' : 'Save changes'}</Text></Pressable>
        <View style={styles.cancelSection}>
          <Text style={styles.cancelTitle}>Cancel {isCircle ? 'this circle' : 'this event'}</Text>
          <Text style={styles.cancelCopy}>This cannot be undone. Members with requests or confirmed places will be notified.</Text>
          <TextInput multiline onChangeText={setCancellationReason} placeholder="Reason for cancellation" placeholderTextColor={colors.muted} style={[styles.input, styles.reasonInput]} textAlignVertical="top" value={cancellationReason} />
          <Pressable accessibilityRole="button" disabled={saving || cancelling} onPress={() => void cancel()} style={[styles.cancelButton, (saving || cancelling) && styles.disabled]}><Text style={styles.cancelText}>{cancelling ? 'Cancelling...' : 'Cancel activity'}</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;
}

function ScheduleControl({ onChange, value }: { onChange: (value: Date) => void; value: Date }) {
  const adjust = (days: number, minutes: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    next.setMinutes(next.getMinutes() + minutes);
    onChange(next);
  };

  return <View style={styles.field}><Text style={styles.label}>Start date and time</Text><View style={styles.scheduleControl}><View style={styles.scheduleRow}><CalendarDays color={colors.primary} size={19} strokeWidth={2.3} /><Text style={styles.scheduleValue}>{value.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short', year: 'numeric' })}</Text><Pressable accessibilityLabel="Previous day" accessibilityRole="button" onPress={() => adjust(-1, 0)} style={styles.scheduleButton}><ChevronLeft color={colors.ink} size={20} strokeWidth={2.5} /></Pressable><Pressable accessibilityLabel="Next day" accessibilityRole="button" onPress={() => adjust(1, 0)} style={styles.scheduleButton}><ChevronRight color={colors.ink} size={20} strokeWidth={2.5} /></Pressable></View><View style={styles.scheduleRow}><Clock3 color={colors.secondary} size={19} strokeWidth={2.3} /><Text style={styles.scheduleValue}>{value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text><Pressable accessibilityLabel="Earlier time" accessibilityRole="button" onPress={() => adjust(0, -30)} style={styles.scheduleButton}><ChevronLeft color={colors.ink} size={20} strokeWidth={2.5} /></Pressable><Pressable accessibilityLabel="Later time" accessibilityRole="button" onPress={() => adjust(0, 30)} style={styles.scheduleButton}><ChevronRight color={colors.ink} size={20} strokeWidth={2.5} /></Pressable></View></View><Text style={styles.helper}>Choose the day and adjust time in 30-minute steps.</Text></View>;
}

function Stepper({ decreaseDisabled, label, onDecrease, onIncrease, value }: { decreaseDisabled: boolean; label: string; onDecrease: () => void; onIncrease: () => void; value: string }) {
  return <Field label={label}><View style={styles.stepper}><Pressable accessibilityLabel={`Decrease ${label}`} accessibilityRole="button" disabled={decreaseDisabled} onPress={onDecrease} style={[styles.stepperButton, decreaseDisabled && styles.disabled]}><CircleMinus color={colors.ink} size={24} strokeWidth={2.3} /></Pressable><Text style={styles.stepperValue}>{value}</Text><Pressable accessibilityLabel={`Increase ${label}`} accessibilityRole="button" onPress={onIncrease} style={styles.stepperButton}><CirclePlus color={colors.ink} size={24} strokeWidth={2.3} /></Pressable></View></Field>;
}

function difficultyValue(value: DiscoveryItem['difficulty']): ActivityEditInput['difficulty'] {
  return value === 'Beginner' ? 'BEGINNER' : value === 'Easy' ? 'EASY' : value === 'Focused' ? 'FOCUSED' : 'SOCIAL';
}

function formatDifficulty(value: ActivityEditInput['difficulty']) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  cancelButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.md, minHeight: 50 },
  cancelCopy: { color: colors.muted, fontSize: typography.small, lineHeight: 20, marginTop: spacing.xs },
  cancelSection: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: spacing.xxl, paddingTop: spacing.xl },
  cancelText: { color: colors.surface, fontSize: typography.body, fontWeight: '800' },
  cancelTitle: { color: colors.primaryDark, fontSize: typography.subheading, fontWeight: '800' },
  choice: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  choiceList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choiceSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  choiceText: { color: colors.ink, fontSize: typography.small, fontWeight: '800' },
  choiceTextSelected: { color: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  disabled: { opacity: 0.55 },
  error: { color: colors.primaryDark, fontSize: typography.small, fontWeight: '700', marginTop: spacing.lg },
  field: { gap: spacing.xs, marginTop: spacing.xl },
  helper: { color: colors.muted, fontSize: typography.small, lineHeight: 19 },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: typography.body, minHeight: 54, paddingHorizontal: spacing.md },
  label: { color: colors.ink, fontSize: typography.small, fontWeight: '800' },
  locationInput: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md },
  locationTextInput: { color: colors.ink, flex: 1, fontSize: typography.body, minHeight: 54 },
  reasonInput: { minHeight: 88, paddingTop: spacing.md },
  saveButton: { alignItems: 'center', backgroundColor: colors.secondary, borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.xl, minHeight: 54 },
  saveText: { color: colors.surface, fontSize: typography.body, fontWeight: '800' },
  scheduleButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 32 },
  scheduleControl: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, paddingVertical: spacing.xs },
  scheduleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.md },
  scheduleValue: { color: colors.ink, flex: 1, fontSize: typography.small, fontWeight: '800' },
  screen: { backgroundColor: colors.background, flex: 1 },
  stepper: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54, paddingHorizontal: spacing.sm },
  stepperButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  stepperValue: { color: colors.ink, fontSize: typography.body, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: typography.body, lineHeight: 23, marginTop: spacing.xs },
  textArea: { minHeight: 128, paddingTop: spacing.md },
  title: { color: colors.ink, fontSize: typography.heading, fontWeight: '800', lineHeight: 34 },
  topBar: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: spacing.md },
  topBarTitle: { color: colors.ink, fontSize: typography.body, fontWeight: '800' },
});
