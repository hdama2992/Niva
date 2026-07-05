import { ArrowRight, MapPin, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { colors, radius, spacing, typography } from '../constants/theme';
import { ProfileDraft } from '../types/niva';

type ProfileSetupScreenProps = {
  username: string;
  onComplete: (profile: ProfileDraft) => void;
};

const interestOptions = [
  'Badminton',
  'Running',
  'Books',
  'Yoga',
  'Coffee',
  'Coding',
  'Painting',
  'Trekking',
  'Career',
  'Wellness',
];

export function ProfileSetupScreen({
  username,
  onComplete,
}: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [ageRange, setAgeRange] = useState('25-30');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('English, Hindi');
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  const selectedEnoughInterests = interests.length >= 3;
  const canContinue = useMemo(
    () =>
      displayName.trim().length >= 2 &&
      city.trim().length >= 2 &&
      selectedEnoughInterests,
    [city, displayName, selectedEnoughInterests],
  );

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
    setError(undefined);
  };

  const continueToDeclaration = () => {
    if (!canContinue) {
      setError('Add your name, city, and at least three interests.');
      return;
    }

    onComplete({
      displayName: displayName.trim(),
      city: city.trim(),
      bio: bio.trim() || undefined,
      ageRange: ageRange.trim() || undefined,
      languages: languages
        .split(',')
        .map((language) => language.trim())
        .filter(Boolean),
      occupation: occupation.trim() || undefined,
      interests,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconPlate}>
            <Sparkles color={colors.secondary} size={34} strokeWidth={2.2} />
          </View>
          <Text style={styles.eyebrow}>@{username}</Text>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            Niva uses interests and city to recommend small recurring groups.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Display name"
            onChangeText={(value) => {
              setDisplayName(value);
              setError(undefined);
            }}
            placeholder="Himaja"
            value={displayName}
          />

          <TextField
            label="City"
            onChangeText={(value) => {
              setCity(value);
              setError(undefined);
            }}
            placeholder="Bangalore"
            value={city}
          />

          <TextField
            label="Age range"
            onChangeText={setAgeRange}
            placeholder="25-30"
            value={ageRange}
          />

          <TextField
            label="Languages"
            onChangeText={setLanguages}
            placeholder="English, Kannada, Hindi"
            value={languages}
          />

          <TextField
            label="Occupation"
            onChangeText={setOccupation}
            placeholder="Designer, student, founder"
            value={occupation}
          />

          <TextField
            label="Bio"
            multiline
            onChangeText={setBio}
            placeholder="New to the city, looking for weekend activities."
            style={styles.bioInput}
            value={bio}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Interests</Text>
            <Text style={styles.sectionMeta}>
              {interests.length}/3 selected
            </Text>
          </View>
          <MapPin color={colors.secondary} size={20} strokeWidth={2.3} />
        </View>

        <View style={styles.interests}>
          {interestOptions.map((interest) => {
            const selected = interests.includes(interest);

            return (
              <Pressable
                accessibilityRole="button"
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[
                  styles.interestChip,
                  selected && styles.interestChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.interestText,
                    selected && styles.interestTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          disabled={!canContinue}
          icon={
            <ArrowRight color={colors.surface} size={20} strokeWidth={2.4} />
          }
          label="Continue"
          onPress={continueToDeclaration}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bioInput: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  container: {
    flex: 1,
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
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  iconPlate: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.lg,
    height: 68,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 68,
  },
  interestChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  interestChipSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  interestText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  interestTextSelected: {
    color: colors.surface,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: 3,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
});
