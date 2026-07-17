import {
  ArrowLeft,
  CircleMinus,
  CirclePlus,
  LockKeyhole,
} from 'lucide-react-native';
import { ReactNode, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DateTimeSelector } from '../components/DateTimeSelector';
import {
  ActivityLocation,
  LocationSelector,
} from '../components/LocationSelector';
import { NivaUser } from '../types/niva';

export type CreateEventInput = {
  capacity: number;
  city: string;
  description: string;
  difficulty: 'BEGINNER' | 'EASY' | 'FOCUSED' | 'SOCIAL';
  interests: string[];
  locationName: string;
  latitude?: number;
  longitude?: number;
  startsAt: string;
  title: string;
};

type CreateEventScreenProps = {
  onBack: () => void;
  onCreate: (input: CreateEventInput) => Promise<void>;
  user: NivaUser;
};

const difficulties: Array<CreateEventInput['difficulty']> = [
  'SOCIAL',
  'BEGINNER',
  'EASY',
  'FOCUSED',
];

export function CreateEventScreen({
  onBack,
  onCreate,
  user,
}: CreateEventScreenProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<ActivityLocation>({
    city: user.city,
    locationName: '',
  });
  const [startsAt, setStartsAt] = useState(defaultStartTime);
  const [capacity, setCapacity] = useState(6);
  const [difficulty, setDifficulty] =
    useState<CreateEventInput['difficulty']>('SOCIAL');
  const [selectedInterests, setSelectedInterests] = useState(() =>
    user.interests.slice(0, 3),
  );
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const canHost = useMemo(
    () =>
      user.trustTier === 'trusted' ||
      user.trustTier === 'host_eligible' ||
      user.trustTier === 'host',
    [user.trustTier],
  );

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        return current.filter((value) => value !== interest);
      }

      return [...current, interest];
    });
  };

  const submit = async () => {
    if (!title.trim() || !description.trim() || !location.locationName.trim()) {
      setError('Add a title, description, and specific meeting location.');
      return;
    }

    if (startsAt.getTime() <= Date.now()) {
      setError('Choose a start time in the future.');
      return;
    }

    if (selectedInterests.length === 0) {
      setError('Choose at least one interest so members can find the event.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await onCreate({
        capacity,
        city: location.city,
        description: description.trim(),
        difficulty,
        interests: selectedInterests,
        latitude: location.latitude,
        locationName: location.locationName.trim(),
        longitude: location.longitude,
        startsAt: startsAt.toISOString(),
        title: title.trim(),
      });
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Unable to create this event.',
      );
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.topBarTitle}>Create event</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {canHost ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Host a small gathering</Text>
          <Text style={styles.subtitle}>
            Keep the first version simple: a clear plan, a public place, and a
            small group.
          </Text>

          <Field label="Event title">
            <TextInput
              onChangeText={setTitle}
              placeholder="Sunday pottery table"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={title}
            />
          </Field>
          <Field label="What will happen?">
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Tell members what to bring, what to expect, and how the session flows."
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={description}
            />
          </Field>
          <Field label="Meeting location">
            <LocationSelector onChange={setLocation} value={location} />
          </Field>
          <DateTimeSelector
            minimumDate={new Date()}
            onChange={setStartsAt}
            value={startsAt}
          />

          <Field label="Group size">
            <View style={styles.stepper}>
              <Pressable
                accessibilityLabel="Decrease capacity"
                accessibilityRole="button"
                disabled={capacity <= 2}
                onPress={() => setCapacity((value) => Math.max(value - 1, 2))}
                style={[
                  styles.stepperButton,
                  capacity <= 2 && styles.stepperButtonDisabled,
                ]}
              >
                <CircleMinus color={colors.ink} size={24} strokeWidth={2.3} />
              </Pressable>
              <Text style={styles.capacityValue}>{capacity} members</Text>
              <Pressable
                accessibilityLabel="Increase capacity"
                accessibilityRole="button"
                onPress={() => setCapacity((value) => Math.min(value + 1, 20))}
                style={styles.stepperButton}
              >
                <CirclePlus color={colors.ink} size={24} strokeWidth={2.3} />
              </Pressable>
            </View>
          </Field>

          <Field label="Event style">
            <View style={styles.choiceList}>
              {difficulties.map((option) => {
                const selected = difficulty === option;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option}
                    onPress={() => setDifficulty(option)}
                    style={[styles.choice, selected && styles.choiceSelected]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selected && styles.choiceTextSelected,
                      ]}
                    >
                      {formatDifficulty(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Interests">
            <View style={styles.choiceList}>
              {user.interests.map((interest) => {
                const selected = selectedInterests.includes(interest);

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[styles.choice, selected && styles.choiceSelected]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selected && styles.choiceTextSelected,
                      ]}
                    >
                      {interest}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void submit()}
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitText}>
              {saving ? 'Creating...' : 'Publish event'}
            </Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.lockedState}>
          <View style={styles.lockedIcon}>
            <LockKeyhole color={colors.info} size={28} strokeWidth={2.3} />
          </View>
          <Text style={styles.lockedTitle}>Host tools are locked</Text>
          <Text style={styles.lockedText}>
            Event creation opens after your host request is approved.
          </Text>
        </View>
      )}
    </View>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function defaultStartTime() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(18, 30, 0, 0);
  return date;
}

function formatDifficulty(value: CreateEventInput['difficulty']) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  capacityValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    minWidth: 112,
    textAlign: 'center',
  },
  choice: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choiceSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  choiceText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  choiceTextSelected: {
    color: colors.surface,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: spacing.lg,
  },
  field: {
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  helper: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
  },
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
  label: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
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
  lockedIcon: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  lockedState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  lockedText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
  lockedTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
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
  stepperButtonDisabled: {
    opacity: 0.42,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 54,
  },
  submitButtonDisabled: {
    opacity: 0.58,
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
  textArea: {
    minHeight: 128,
    paddingTop: spacing.md,
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
