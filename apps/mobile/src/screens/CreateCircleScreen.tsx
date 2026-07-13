import {
  ArrowLeft,
  CircleMinus,
  CirclePlus,
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
import { NivaUser } from '../types/niva';

export type CreateCircleInput = {
  capacity: number;
  description: string;
  difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
  durationWeeks: number;
  interests: string[];
  locationName: string;
  schedule: string;
  startsAt: string;
  title: string;
};

type CreateCircleScreenProps = {
  onBack: () => void;
  onCreate: (input: CreateCircleInput) => Promise<void>;
  user: NivaUser;
};

const difficulties: CreateCircleInput['difficulty'][] = [
  'SOCIAL',
  'BEGINNER',
  'EASY',
  'FOCUSED',
];

export function CreateCircleScreen({
  onBack,
  onCreate,
  user,
}: CreateCircleScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [startsAtText, setStartsAtText] = useState(defaultStartTime());
  const [schedule, setSchedule] = useState('Every Saturday, 10:00 AM');
  const [durationWeeks, setDurationWeeks] = useState(6);
  const [capacity, setCapacity] = useState(6);
  const [difficulty, setDifficulty] =
    useState<CreateCircleInput['difficulty']>('SOCIAL');
  const [interests, setInterests] = useState(user.interests.slice(0, 3));
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((value) => value !== interest)
        : [...current, interest],
    );
  };

  const submit = async () => {
    const startsAt = parseLocalDateTime(startsAtText);
    if (!title.trim() || !description.trim() || !locationName.trim()) {
      setError('Add a title, description, and specific meeting location.');
      return;
    }
    if (!startsAt || !schedule.trim()) {
      setError('Add a valid first date and a recurring schedule.');
      return;
    }
    if (!interests.length) {
      setError('Choose at least one interest for this circle.');
      return;
    }

    try {
      setSaving(true);
      setError(undefined);
      await onCreate({
        capacity,
        description: description.trim(),
        difficulty,
        durationWeeks,
        interests,
        locationName: locationName.trim(),
        schedule: schedule.trim(),
        startsAt: startsAt.toISOString(),
        title: title.trim(),
      });
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Unable to create this circle.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={10} onPress={onBack} style={styles.iconButton}>
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topBarTitle}>Create circle</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Build a recurring group</Text>
        <Text style={styles.subtitle}>Use a reliable rhythm and a small cohort so members can return to the same people.</Text>
        <Field label="Circle title"><TextInput onChangeText={setTitle} placeholder="Six-week pottery table" placeholderTextColor={colors.muted} style={styles.input} value={title} /></Field>
        <Field label="What will the group do?"><TextInput multiline onChangeText={setDescription} placeholder="Explain the activity, preparation, and group rhythm." placeholderTextColor={colors.muted} style={[styles.input, styles.textArea]} textAlignVertical="top" value={description} /></Field>
        <Field label="Meeting location"><View style={styles.locationInput}><MapPin color={colors.secondary} size={19} strokeWidth={2.3} /><TextInput onChangeText={setLocationName} placeholder="Venue or public meeting point" placeholderTextColor={colors.muted} style={styles.locationTextInput} value={locationName} /></View></Field>
        <Field label="First session"><TextInput autoCapitalize="none" keyboardType="numbers-and-punctuation" onChangeText={setStartsAtText} placeholder="2026-07-20 18:30" placeholderTextColor={colors.muted} style={styles.input} value={startsAtText} /><Text style={styles.helper}>Use local time in YYYY-MM-DD HH:MM format.</Text></Field>
        <Field label="Recurring schedule"><TextInput onChangeText={setSchedule} placeholder="Every Saturday, 10:00 AM" placeholderTextColor={colors.muted} style={styles.input} value={schedule} /></Field>
        <Stepper label="Circle length" value={`${durationWeeks} weeks`} onDecrease={() => setDurationWeeks((value) => Math.max(2, value - 1))} onIncrease={() => setDurationWeeks((value) => Math.min(16, value + 1))} decreaseDisabled={durationWeeks <= 2} />
        <Stepper label="Cohort size" value={`${capacity} members`} onDecrease={() => setCapacity((value) => Math.max(2, value - 1))} onIncrease={() => setCapacity((value) => Math.min(16, value + 1))} decreaseDisabled={capacity <= 2} />
        <Field label="Circle style"><ChoiceList values={difficulties} selected={difficulty} onPress={setDifficulty} /></Field>
        <Field label="Interests"><View style={styles.choiceList}>{user.interests.map((interest) => <Pressable accessibilityRole="button" key={interest} onPress={() => toggleInterest(interest)} style={[styles.choice, interests.includes(interest) && styles.choiceSelected]}><Text style={[styles.choiceText, interests.includes(interest) && styles.choiceTextSelected]}>{interest}</Text></Pressable>)}</View></Field>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void submit()} style={[styles.submitButton, saving && styles.disabled]}><Text style={styles.submitText}>{saving ? 'Creating...' : 'Publish circle'}</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>;
}

function Stepper({ decreaseDisabled, label, onDecrease, onIncrease, value }: { decreaseDisabled: boolean; label: string; onDecrease: () => void; onIncrease: () => void; value: string }) {
  return <Field label={label}><View style={styles.stepper}><Pressable accessibilityLabel={`Decrease ${label}`} accessibilityRole="button" disabled={decreaseDisabled} onPress={onDecrease} style={[styles.stepperButton, decreaseDisabled && styles.disabled]}><CircleMinus color={colors.ink} size={24} strokeWidth={2.3} /></Pressable><Text style={styles.stepperValue}>{value}</Text><Pressable accessibilityLabel={`Increase ${label}`} accessibilityRole="button" onPress={onIncrease} style={styles.stepperButton}><CirclePlus color={colors.ink} size={24} strokeWidth={2.3} /></Pressable></View></Field>;
}

function ChoiceList({ onPress, selected, values }: { onPress: (value: CreateCircleInput['difficulty']) => void; selected: CreateCircleInput['difficulty']; values: CreateCircleInput['difficulty'][] }) {
  return <View style={styles.choiceList}>{values.map((value) => <Pressable accessibilityRole="button" key={value} onPress={() => onPress(value)} style={[styles.choice, selected === value && styles.choiceSelected]}><Text style={[styles.choiceText, selected === value && styles.choiceTextSelected]}>{value.charAt(0) + value.slice(1).toLowerCase()}</Text></Pressable>)}</View>;
}

function defaultStartTime() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(18, 30, 0, 0);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} 18:30`;
}

function parseLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const [, year, month, day, hour, minute] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

const styles = StyleSheet.create({
  choice: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  choiceList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choiceSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  choiceText: { color: colors.ink, fontSize: typography.small, fontWeight: '800' },
  choiceTextSelected: { color: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  disabled: { opacity: 0.55 },
  error: { color: colors.primaryDark, fontSize: typography.small, fontWeight: '700', marginTop: spacing.lg },
  field: { gap: spacing.xs, marginTop: spacing.xl },
  helper: { color: colors.muted, fontSize: typography.small },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: typography.body, minHeight: 54, paddingHorizontal: spacing.md },
  label: { color: colors.ink, fontSize: typography.small, fontWeight: '800' },
  locationInput: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 54, paddingHorizontal: spacing.md },
  locationTextInput: { color: colors.ink, flex: 1, fontSize: typography.body, minHeight: 54 },
  screen: { backgroundColor: colors.background, flex: 1 },
  stepper: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54, paddingHorizontal: spacing.sm },
  stepperButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  stepperValue: { color: colors.ink, fontSize: typography.body, fontWeight: '800' },
  submitButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.lg, minHeight: 54 },
  submitText: { color: colors.surface, fontSize: typography.body, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: typography.body, lineHeight: 23, marginTop: spacing.xs },
  textArea: { minHeight: 128, paddingTop: spacing.md },
  title: { color: colors.ink, fontSize: typography.heading, fontWeight: '800', lineHeight: 34 },
  topBar: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: spacing.md },
  topBarTitle: { color: colors.ink, fontSize: typography.body, fontWeight: '800' },
});
