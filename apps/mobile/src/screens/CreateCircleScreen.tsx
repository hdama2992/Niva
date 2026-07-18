import {
  CalendarDays,
  CheckCircle2,
  CircleMinus,
  CirclePlus,
  MapPin,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DateTimeSelector } from '../components/DateTimeSelector';
import { ActivityCoverSelector } from '../components/ActivityCoverSelector';
import {
  formatRecurringSchedule,
  RecurringCadence,
  RecurringScheduleSelector,
} from '../components/RecurringScheduleSelector';
import {
  ActivityLocation,
  LocationSelector,
} from '../components/LocationSelector';
import { NivaUser } from '../types/niva';
import { SelectedImage } from '../services/media';
import { DeckTopBar } from '../components/DeckTopBar';
import { resolveActivityArtwork } from '../constants/activity-artwork';

export type CreateCircleInput = {
  capacity: number;
  city: string;
  coverImage?: SelectedImage;
  description: string;
  difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
  hostNote?: string;
  durationWeeks: number;
  interests: string[];
  locationName: string;
  latitude?: number;
  longitude?: number;
  recurrenceIntervalWeeks: number;
  schedule: string;
  startsAt: string;
  title: string;
  timezone: string;
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
  const [hostNote, setHostNote] = useState('');
  const [coverImage, setCoverImage] = useState<SelectedImage>();
  const [location, setLocation] = useState<ActivityLocation>({
    city: user.city,
    locationName: '',
  });
  const [startsAt, setStartsAt] = useState(defaultStartTime);
  const [cadence, setCadence] = useState<RecurringCadence>('WEEKLY');
  const [durationWeeks, setDurationWeeks] = useState(6);
  const [capacity, setCapacity] = useState(6);
  const [difficulty, setDifficulty] =
    useState<CreateCircleInput['difficulty']>('SOCIAL');
  const [interests, setInterests] = useState(user.interests.slice(0, 3));
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const basicsReady = Boolean(
    title.trim() && description.trim() && interests.length,
  );
  const timeReady = Boolean(
    location.locationName.trim() && startsAt.getTime() > Date.now(),
  );
  const safetyReady = Boolean(hostNote.trim());

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((value) => value !== interest)
        : [...current, interest],
    );
  };

  const submit = async () => {
    if (!title.trim() || !description.trim() || !location.locationName.trim()) {
      setError('Add a title, description, and specific meeting location.');
      return;
    }
    if (startsAt.getTime() <= Date.now()) {
      setError('Choose a future first session.');
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
        city: location.city,
        coverImage,
        description: description.trim(),
        difficulty,
        hostNote: hostNote.trim() || undefined,
        durationWeeks,
        interests,
        latitude: location.latitude,
        locationName: location.locationName.trim(),
        longitude: location.longitude,
        recurrenceIntervalWeeks: cadence === 'FORTNIGHTLY' ? 2 : 1,
        schedule: formatRecurringSchedule(startsAt, cadence),
        startsAt: startsAt.toISOString(),
        title: title.trim(),
        timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
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
      <DeckTopBar
        onBack={onBack}
        right={
          <Text style={styles.previewStatus}>
            {saving ? 'Publishing…' : 'Preview'}
          </Text>
        }
        title="New recurring plan"
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          imageStyle={styles.previewImage}
          source={
            coverImage
              ? { uri: coverImage.uri }
              : resolveActivityArtwork({
                  interests,
                  title: title || 'Recurring creative circle',
                })
          }
          style={styles.previewCard}
        >
          <View style={styles.previewShade} />
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>RECURRING PREVIEW</Text>
          </View>
          <View style={styles.previewCopy}>
            <Text numberOfLines={2} style={styles.previewTitle}>
              {title.trim() || 'Your recurring plan'}
            </Text>
            <View style={styles.previewMetaRow}>
              <MapPin color={colors.surface} size={17} />
              <Text numberOfLines={1} style={styles.previewMeta}>
                {location.locationName ||
                  location.city ||
                  'Choose a meeting place'}
              </Text>
            </View>
            <View style={styles.previewMetaRow}>
              <CalendarDays color={colors.surface} size={17} />
              <Text style={styles.previewMeta}>
                {formatRecurringSchedule(startsAt, cadence)} · {durationWeeks}{' '}
                weeks
              </Text>
            </View>
            <View style={styles.previewMetaRow}>
              <UsersRound color={colors.surface} size={17} />
              <Text style={styles.previewMeta}>
                Same group · Up to {capacity}
              </Text>
            </View>
          </View>
        </ImageBackground>
        <Text style={styles.photoHelper}>
          Add a real photo of the experience. If you skip this, Niva uses a
          category image.
        </Text>
        <ActivityCoverSelector onChange={setCoverImage} value={coverImage} />
        <View style={styles.completionHeader}>
          <Text style={styles.title}>Complete your plan</Text>
          <Text style={styles.subtitle}>
            {[basicsReady, timeReady, safetyReady].filter(Boolean).length} of 3
            ready
          </Text>
        </View>
        <View style={styles.readinessCard}>
          <ReadinessRow
            Icon={CheckCircle2}
            ready={basicsReady}
            text="Name, rhythm and interests"
            title="Basics"
          />
          <ReadinessRow
            Icon={MapPin}
            ready={timeReady}
            text="First session and venue"
            title="Time & place"
          />
          <ReadinessRow
            Icon={ShieldCheck}
            ready={safetyReady}
            text="Host note and group guidance"
            title="Welcome & safety"
          />
        </View>
        <Field label="Circle title">
          <TextInput
            onChangeText={setTitle}
            placeholder="Six-week pottery table"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={title}
          />
        </Field>
        <Field label="What will the group do?">
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Explain the activity, preparation, and group rhythm."
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={description}
          />
        </Field>
        <Field label="A note from your host (optional)">
          <TextInput
            maxLength={400}
            multiline
            onChangeText={setHostNote}
            placeholder="Share the feeling you want this circle to have and how you’ll welcome the group."
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={hostNote}
          />
          <Text style={styles.helper}>
            This introduction stays with every session in the circle.
          </Text>
        </Field>
        <Field label="Meeting location">
          <LocationSelector onChange={setLocation} value={location} />
        </Field>
        <DateTimeSelector
          minimumDate={new Date()}
          onChange={setStartsAt}
          value={startsAt}
        />
        <RecurringScheduleSelector
          cadence={cadence}
          onChange={setCadence}
          startsAt={startsAt}
        />
        <Stepper
          label="Circle length"
          value={`${durationWeeks} weeks`}
          onDecrease={() => setDurationWeeks((value) => Math.max(2, value - 1))}
          onIncrease={() =>
            setDurationWeeks((value) => Math.min(16, value + 1))
          }
          decreaseDisabled={durationWeeks <= 2}
        />
        <Stepper
          label="Cohort size"
          value={`${capacity} members`}
          onDecrease={() => setCapacity((value) => Math.max(2, value - 1))}
          onIncrease={() => setCapacity((value) => Math.min(16, value + 1))}
          decreaseDisabled={capacity <= 2}
        />
        <Field label="Circle style">
          <ChoiceList
            values={difficulties}
            selected={difficulty}
            onPress={setDifficulty}
          />
        </Field>
        <Field label="Interests">
          <View style={styles.choiceList}>
            {user.interests.map((interest) => (
              <Pressable
                accessibilityRole="button"
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[
                  styles.choice,
                  interests.includes(interest) && styles.choiceSelected,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    interests.includes(interest) && styles.choiceTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </Pressable>
            ))}
          </View>
        </Field>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => void submit()}
          style={[styles.submitButton, saving && styles.disabled]}
        >
          <Text style={styles.submitText}>
            {saving ? 'Creating…' : 'Finish setup and publish'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ReadinessRow({
  Icon,
  ready,
  text,
  title,
}: {
  Icon: typeof CheckCircle2;
  ready: boolean;
  text: string;
  title: string;
}) {
  return (
    <View style={styles.readinessRow}>
      <View
        style={[styles.readinessIcon, !ready && styles.readinessIconPending]}
      >
        <Icon color={ready ? colors.success : colors.warning} size={22} />
      </View>
      <View style={styles.readinessCopy}>
        <Text style={styles.readinessTitle}>{title}</Text>
        <Text style={styles.readinessText}>{text}</Text>
      </View>
      <CheckCircle2 color={ready ? colors.success : colors.border} size={23} />
    </View>
  );
}

function Stepper({
  decreaseDisabled,
  label,
  onDecrease,
  onIncrease,
  value,
}: {
  decreaseDisabled: boolean;
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  value: string;
}) {
  return (
    <Field label={label}>
      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel={`Decrease ${label}`}
          accessibilityRole="button"
          disabled={decreaseDisabled}
          onPress={onDecrease}
          style={[styles.stepperButton, decreaseDisabled && styles.disabled]}
        >
          <CircleMinus color={colors.ink} size={24} strokeWidth={2.3} />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          accessibilityLabel={`Increase ${label}`}
          accessibilityRole="button"
          onPress={onIncrease}
          style={styles.stepperButton}
        >
          <CirclePlus color={colors.ink} size={24} strokeWidth={2.3} />
        </Pressable>
      </View>
    </Field>
  );
}

function ChoiceList({
  onPress,
  selected,
  values,
}: {
  onPress: (value: CreateCircleInput['difficulty']) => void;
  selected: CreateCircleInput['difficulty'];
  values: CreateCircleInput['difficulty'][];
}) {
  return (
    <View style={styles.choiceList}>
      {values.map((value) => (
        <Pressable
          accessibilityRole="button"
          key={value}
          onPress={() => onPress(value)}
          style={[styles.choice, selected === value && styles.choiceSelected]}
        >
          <Text
            style={[
              styles.choiceText,
              selected === value && styles.choiceTextSelected,
            ]}
          >
            {value.charAt(0) + value.slice(1).toLowerCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function defaultStartTime() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(18, 30, 0, 0);
  return date;
}

const styles = StyleSheet.create({
  choice: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choiceSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  choiceText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  choiceTextSelected: { color: colors.surface },
  completionHeader: { marginTop: spacing.xl },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  disabled: { opacity: 0.55 },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  field: { gap: spacing.xs, marginTop: spacing.xl },
  helper: { color: colors.muted, fontSize: typography.small },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  label: { color: colors.ink, fontSize: typography.small, fontWeight: '800' },
  locationInput: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  locationTextInput: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    minHeight: 54,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  photoHelper: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  previewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  previewBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  previewCard: { height: 330, justifyContent: 'flex-end', overflow: 'hidden' },
  previewCopy: { padding: spacing.lg },
  previewImage: { borderRadius: radius.lg },
  previewMeta: {
    color: colors.surface,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
  },
  previewMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  previewShade: {
    backgroundColor: 'rgba(5,35,65,0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '42%',
  },
  previewStatus: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  previewTitle: {
    color: colors.surface,
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 35,
  },
  readinessCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  readinessCopy: { flex: 1 },
  readinessIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  readinessIconPending: { backgroundColor: colors.warningSoft },
  readinessRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 76,
  },
  readinessText: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 3,
  },
  readinessTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: spacing.sm,
  },
  stepperButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stepperValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 54,
  },
  submitText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  textArea: { minHeight: 128, paddingTop: spacing.md },
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
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  topBarTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
