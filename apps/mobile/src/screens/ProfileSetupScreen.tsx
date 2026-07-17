import {
  ArrowRight,
  Camera,
  MapPin,
  Minus,
  Plus,
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
  username,
  onComplete,
}: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState(username);
  const [age, setAge] = useState<number>();
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [occupation, setOccupation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [profilePhoto, setProfilePhoto] = useState<SelectedProfilePhoto>();
  const [error, setError] = useState<string>();

  const selectedEnoughInterests = interests.length >= 3;
  const canContinue = useMemo(
    () =>
      displayName.trim().length >= 2 &&
      age !== undefined &&
      age >= 18 &&
      age <= 100 &&
      languages.length > 0 &&
      Boolean(profilePhoto) &&
      selectedEnoughInterests,
    [age, displayName, languages, profilePhoto, selectedEnoughInterests],
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

  const continueToDeclaration = () => {
    if (!canContinue) {
      setError(
        'Add a profile photo and complete every required field before continuing.',
      );
      return;
    }

    onComplete({
      displayName: displayName.trim(),
      city: betaCity,
      bio: bio.trim() || undefined,
      age,
      languages,
      occupation: occupation.trim() || undefined,
      profilePhoto,
      interests,
    });
  };

  const chooseProfilePhoto = async () => {
    try {
      const photo = await pickProfilePhoto();
      setProfilePhoto(photo);
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
          <Text style={styles.requiredNote}>* Required</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void chooseProfilePhoto()}
          style={styles.profilePhotoPicker}
        >
          {profilePhoto ? (
            <Image
              source={{ uri: profilePhoto.uri }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Camera color={colors.secondary} size={24} strokeWidth={2.3} />
            </View>
          )}
          <View style={styles.profilePhotoCopy}>
            <Text style={styles.profilePhotoTitle}>Profile photo *</Text>
            <Text style={styles.profilePhotoMeta}>
              Add a clear photo so approved members can recognise you.
            </Text>
          </View>
        </Pressable>

        <View style={styles.form}>
          <TextField
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
            onChange={(value) => {
              setAge(value);
              setError(undefined);
            }}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Languages *</Text>
            <Text style={styles.fieldMeta}>Select every language you use.</Text>
            <View style={styles.choiceList}>
              {languageOptions.map((language) => {
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

function AgeField({
  age,
  onChange,
}: {
  age?: number;
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
});
