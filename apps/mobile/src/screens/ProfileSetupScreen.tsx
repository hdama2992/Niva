import {
  ArrowLeft,
  ArrowRight,
  Camera,
  MapPin,
  Minus,
  Plus,
  Save,
  Sparkles,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { colors, radius, spacing, typography } from '../constants/theme';
import { pickProfilePhoto } from '../services/media';
import { ProfileDraft, SelectedProfilePhoto } from '../types/niva';

type ProfileSetupScreenProps = {
  initialProfile?: ProfileDraft;
  initialProfilePhotoUrl?: string;
  mode?: 'create' | 'edit';
  onBack?: () => void;
  username: string;
  onComplete: (profile: ProfileDraft) => Promise<void> | void;
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
const languageOptions = [
  'English',
  'Kannada',
  'Hindi',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Odia',
  'Urdu',
];
const betaCity = 'Bangalore';

export function ProfileSetupScreen({
  initialProfile,
  initialProfilePhotoUrl,
  mode = 'create',
  onBack,
  username,
  onComplete,
}: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState(
    initialProfile?.displayName ?? username,
  );
  const [age, setAge] = useState<number | undefined>(initialProfile?.age);
  const [bio, setBio] = useState(initialProfile?.bio ?? '');
  const [languages, setLanguages] = useState<string[]>(
    initialProfile?.languages ?? [],
  );
  const [occupation, setOccupation] = useState(
    initialProfile?.occupation ?? '',
  );
  const [interests, setInterests] = useState<string[]>(
    initialProfile?.interests ?? [],
  );
  const [profilePhoto, setProfilePhoto] = useState<SelectedProfilePhoto>();
  const [error, setError] = useState<string>();
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedEnoughInterests = interests.length >= 3;
  const hasProfilePhoto = Boolean(profilePhoto || initialProfilePhotoUrl);
  const availableLanguages = useMemo(
    () =>
      Array.from(
        new Set([...languageOptions, ...(initialProfile?.languages ?? [])]),
      ),
    [initialProfile?.languages],
  );
  const availableInterests = useMemo(
    () =>
      Array.from(
        new Set([...interestOptions, ...(initialProfile?.interests ?? [])]),
      ),
    [initialProfile?.interests],
  );
  const canContinue = useMemo(
    () =>
      displayName.trim().length >= 2 &&
      age !== undefined &&
      age >= 18 &&
      age <= 100 &&
      languages.length > 0 &&
      hasProfilePhoto &&
      selectedEnoughInterests,
    [age, displayName, hasProfilePhoto, languages, selectedEnoughInterests],
  );

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
    setError(undefined);
  };

  const toggleLanguage = (language: string) => {
    setLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
    setError(undefined);
  };

  const continueToDeclaration = async () => {
    setAttempted(true);

    if (!canContinue) {
      return;
    }

    setSubmitting(true);
    try {
      await onComplete({
        displayName: displayName.trim(),
        city: betaCity,
        bio: bio.trim() || undefined,
        age,
        languages,
        occupation: occupation.trim() || undefined,
        profilePhoto,
        interests,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const chooseProfilePhoto = async () => {
    try {
      const photo = await pickProfilePhoto();
      if (photo) {
        setProfilePhoto(photo);
      }
      setError(undefined);
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : 'Unable to select a profile photo.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
      {mode === 'edit' ? (
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.topBarTitle}>Profile</Text>
          <View style={styles.topBarSpacer} />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {mode === 'create' ? (
            <View style={styles.iconPlate}>
              <Sparkles color={colors.secondary} size={34} strokeWidth={2.2} />
            </View>
          ) : null}
          <Text style={styles.eyebrow}>@{username}</Text>
          <Text style={styles.title}>
            {mode === 'edit' ? 'Edit your profile' : 'Complete your profile'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'edit'
              ? 'Keep your details current for the groups you join.'
              : 'Niva uses interests and city to recommend small recurring groups.'}
          </Text>
          <Text style={styles.requiredNote}>* Required</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void chooseProfilePhoto()}
          style={[
            styles.profilePhotoPicker,
            attempted && !hasProfilePhoto && styles.invalidField,
          ]}
        >
          {profilePhoto || initialProfilePhotoUrl ? (
            <Image
              source={{ uri: profilePhoto?.uri ?? initialProfilePhotoUrl }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Camera color={colors.secondary} size={24} strokeWidth={2.3} />
            </View>
          )}
          <View style={styles.profilePhotoCopy}>
            <Text style={styles.profilePhotoTitle}>
              {mode === 'edit' ? 'Change profile photo' : 'Profile photo *'}
            </Text>
            <Text style={styles.profilePhotoMeta}>
              {mode === 'edit'
                ? 'Your current photo remains unless you choose a new one.'
                : 'Add a clear photo so approved members can recognise you.'}
            </Text>
          </View>
        </Pressable>
        {attempted && !hasProfilePhoto ? (
          <Text style={styles.fieldError}>Add a profile photo.</Text>
        ) : null}

        <View style={styles.form}>
          <TextField
            error={
              attempted && displayName.trim().length < 2
                ? 'Enter at least two characters.'
                : undefined
            }
            label="Display name *"
            onChangeText={(value) => {
              setDisplayName(value);
              setError(undefined);
            }}
            placeholder="Himaja"
            value={displayName}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>City *</Text>
            <View style={styles.fixedField}>
              <MapPin color={colors.secondary} size={21} strokeWidth={2.4} />
              <View>
                <Text style={styles.fixedFieldValue}>{betaCity}</Text>
                <Text style={styles.fixedFieldMeta}>Closed beta city</Text>
              </View>
            </View>
          </View>

          <AgeField
            age={age}
            error={
              attempted && (age === undefined || age < 18 || age > 100)
                ? 'Enter an age between 18 and 100.'
                : undefined
            }
            onChange={(value) => {
              setAge(value);
              setError(undefined);
            }}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Languages *</Text>
            <Text style={styles.fieldMeta}>Select every language you use.</Text>
            <View style={styles.choiceList}>
              {availableLanguages.map((language) => {
                const selected = languages.includes(language);

                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    key={language}
                    onPress={() => toggleLanguage(language)}
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
                      {language}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {attempted && languages.length === 0 ? (
              <Text style={styles.fieldError}>
                Select at least one language.
              </Text>
            ) : null}
          </View>

          <TextField
            label="Occupation (optional)"
            onChangeText={setOccupation}
            placeholder="Designer, student, founder"
            value={occupation}
          />

          <TextField
            label="Bio (optional)"
            multiline
            onChangeText={setBio}
            placeholder="New to the city, looking for weekend activities."
            style={styles.bioInput}
            value={bio}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Interests *</Text>
            <Text style={styles.sectionMeta}>{interests.length}/3 minimum</Text>
          </View>
        </View>

        <View style={styles.interests}>
          {availableInterests.map((interest) => {
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

        {attempted && !selectedEnoughInterests ? (
          <Text style={styles.fieldError}>
            Select at least three interests.
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          disabled={submitting}
          icon={
            mode === 'edit' ? (
              <Save color={colors.surface} size={20} strokeWidth={2.4} />
            ) : (
              <ArrowRight color={colors.surface} size={20} strokeWidth={2.4} />
            )
          }
          label={
            submitting
              ? 'Saving...'
              : mode === 'edit'
                ? 'Save changes'
                : 'Continue'
          }
          onPress={() => void continueToDeclaration()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AgeField({
  age,
  error,
  onChange,
}: {
  age?: number;
  error?: string;
  onChange: (age?: number) => void;
}) {
  const updateFromText = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 3);
    onChange(digits ? Number(digits) : undefined);
  };

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>Age *</Text>
      <View style={styles.ageControl}>
        <Pressable
          accessibilityLabel="Decrease age"
          accessibilityRole="button"
          disabled={age === undefined || age <= 18}
          onPress={() => onChange(Math.max(18, (age ?? 19) - 1))}
          style={[
            styles.ageButton,
            (age === undefined || age <= 18) && styles.ageButtonDisabled,
          ]}
        >
          <Minus color={colors.ink} size={20} strokeWidth={2.5} />
        </Pressable>
        <TextInput
          accessibilityLabel="Age"
          keyboardType="number-pad"
          maxLength={3}
          onChangeText={updateFromText}
          placeholder="Enter age"
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          style={styles.ageInput}
          value={age?.toString() ?? ''}
        />
        <Pressable
          accessibilityLabel="Increase age"
          accessibilityRole="button"
          disabled={age !== undefined && age >= 100}
          onPress={() =>
            onChange(age === undefined ? 18 : Math.min(100, age + 1))
          }
          style={[
            styles.ageButton,
            age !== undefined && age >= 100 && styles.ageButtonDisabled,
          ]}
        >
          <Plus color={colors.ink} size={20} strokeWidth={2.5} />
        </Pressable>
      </View>
      <Text style={styles.fieldMeta}>You must be 18 or older.</Text>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ageButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  ageButtonDisabled: {
    opacity: 0.35,
  },
  ageControl: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    padding: spacing.xs,
  },
  ageInput: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    minWidth: 0,
    textAlign: 'center',
  },
  bioInput: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  choiceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
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
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldError: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '700',
  },
  fieldMeta: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  fixedField: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  fixedFieldMeta: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 2,
  },
  fixedFieldValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  invalidField: {
    borderColor: colors.primaryDark,
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
  profilePhoto: {
    borderRadius: radius.pill,
    height: 56,
    width: 56,
  },
  profilePhotoCopy: {
    flex: 1,
  },
  profilePhotoMeta: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: 2,
  },
  profilePhotoPicker: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  profilePhotoPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  profilePhotoTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  requiredNote: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.sm,
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
  topBar: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  topBarSpacer: {
    height: 40,
    width: 40,
  },
  topBarTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
