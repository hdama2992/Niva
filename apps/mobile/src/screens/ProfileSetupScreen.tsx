import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Camera,
  ImagePlus,
  Save,
  X,
  XCircle,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { pickProfilePhoto, takeProfilePhoto } from '../services/media';
import { ProfileDraft, SelectedProfilePhoto } from '../types/niva';

type ProfileSetupScreenProps = {
  initialProfile?: ProfileDraft;
  initialProfilePhotoUrl?: string;
  mode?: 'create' | 'edit';
  onBack?: () => void;
  onCheckUsernameAvailability?: (
    username: string,
  ) => Promise<{ available: boolean; username: string }>;
  username: string;
  onComplete: (profile: ProfileDraft, username: string) => Promise<void> | void;
};

type UsernameAvailability =
  'available' | 'checking' | 'idle' | 'taken' | 'unavailable';

const usernamePattern = /^[a-z0-9_]{3,20}$/;

const interestOptions = [
  'Badminton',
  'Running',
  'Books',
  'Yoga',
  'Coffee',
  'Coding',
  'Painting',
  'Trekking',
  'Music',
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

export function ProfileSetupScreen({
  initialProfile,
  initialProfilePhotoUrl,
  mode = 'create',
  onBack,
  onCheckUsernameAvailability,
  username,
  onComplete,
}: ProfileSetupScreenProps) {
  const [profileUsername, setProfileUsername] = useState(username);
  const [usernameAvailability, setUsernameAvailability] =
    useState<UsernameAvailability>(username ? 'available' : 'idle');
  const [displayName, setDisplayName] = useState(
    initialProfile?.displayName ?? username,
  );
  const [city, setCity] = useState(initialProfile?.city ?? '');
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
  const [customInterest, setCustomInterest] = useState('');
  const [customInterestOpen, setCustomInterestOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<SelectedProfilePhoto>();
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== 'create' || !onCheckUsernameAvailability) {
      return;
    }

    const normalizedUsername = profileUsername.trim();
    if (!usernamePattern.test(normalizedUsername)) {
      setUsernameAvailability('idle');
      return;
    }

    if (normalizedUsername === username && username) {
      setUsernameAvailability('available');
      return;
    }

    setUsernameAvailability('checking');
    let active = true;
    const timer = setTimeout(() => {
      void onCheckUsernameAvailability(normalizedUsername)
        .then(({ available }) => {
          if (active) {
            setUsernameAvailability(available ? 'available' : 'taken');
          }
        })
        .catch(() => {
          if (active) {
            setUsernameAvailability('unavailable');
          }
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [mode, onCheckUsernameAvailability, profileUsername, username]);

  const selectedEnoughInterests = interests.length >= 3;
  const hasProfilePhoto = Boolean(profilePhoto || initialProfilePhotoUrl);
  const availableLanguages = useMemo(
    () =>
      Array.from(
        new Set([...languageOptions, ...(initialProfile?.languages ?? [])]),
      ),
    [initialProfile?.languages],
  );
  const customInterests = useMemo(
    () => interests.filter((interest) => !interestOptions.includes(interest)),
    [interests],
  );
  const canContinue = useMemo(
    () =>
      displayName.trim().length >= 2 &&
      city.trim().length >= 2 &&
      age !== undefined &&
      age >= 18 &&
      age <= 100 &&
      languages.length > 0 &&
      hasProfilePhoto &&
      selectedEnoughInterests &&
      (mode === 'edit' ||
        (usernamePattern.test(profileUsername.trim()) &&
          usernameAvailability === 'available')),
    [
      age,
      city,
      displayName,
      hasProfilePhoto,
      languages,
      mode,
      profileUsername,
      selectedEnoughInterests,
      usernameAvailability,
    ],
  );

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
    setError(undefined);
  };

  const addCustomInterest = () => {
    const normalizedInterest = customInterest.trim().replace(/\s+/g, ' ');

    if (normalizedInterest.length < 2) {
      setError('Enter at least two characters for your interest.');
      return;
    }

    if (
      interests.some(
        (interest) =>
          interest.toLowerCase() === normalizedInterest.toLowerCase(),
      )
    ) {
      setError('That interest is already selected.');
      return;
    }

    setInterests((current) => [...current, normalizedInterest]);
    setCustomInterest('');
    setCustomInterestOpen(false);
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
      await onComplete(
        {
          displayName: displayName.trim(),
          city: city.trim(),
          bio: bio.trim() || undefined,
          age,
          languages,
          occupation: occupation.trim() || undefined,
          profilePhoto,
          interests,
        },
        profileUsername.trim(),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const chooseProfilePhoto = async (source: 'camera' | 'library') => {
    setPhotoSourceOpen(false);
    try {
      const photo =
        source === 'camera'
          ? await takeProfilePhoto()
          : await pickProfilePhoto();
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
          {mode === 'edit' ? (
            <Text style={styles.eyebrow}>@{username}</Text>
          ) : null}
          <Text style={styles.title}>
            {mode === 'edit' ? 'Edit your profile' : 'Complete your profile'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'edit'
              ? 'Keep your details up to date.'
              : 'Tell us a little about yourself.'}
          </Text>
          <Text style={styles.requiredNote}>* Required</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setPhotoSourceOpen(true)}
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
              Choose a photo or take one now.
            </Text>
          </View>
        </Pressable>
        {attempted && !hasProfilePhoto ? (
          <Text style={styles.fieldError}>Add a profile photo.</Text>
        ) : null}

        <View style={styles.form}>
          {mode === 'create' ? (
            <View style={styles.usernameGroup}>
              <TextField
                autoCapitalize="none"
                autoCorrect={false}
                error={
                  attempted && !usernamePattern.test(profileUsername.trim())
                    ? 'Use 3-20 lowercase letters, numbers, or underscores.'
                    : attempted && usernameAvailability === 'taken'
                      ? 'That username is already taken.'
                      : undefined
                }
                helperText="Your unique name in Niva."
                label="Username *"
                onChangeText={(value) => {
                  setProfileUsername(
                    value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  );
                  setUsernameAvailability('idle');
                  setError(undefined);
                }}
                placeholder="yourname"
                value={profileUsername}
              />
              <UsernameAvailabilityMessage
                availability={usernameAvailability}
              />
            </View>
          ) : null}

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

          <TextField
            error={
              attempted && (age === undefined || age < 18 || age > 100)
                ? 'Enter an age between 18 and 100.'
                : undefined
            }
            helperText="You must be 18 or older."
            keyboardType="number-pad"
            label="Age *"
            maxLength={3}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, '').slice(0, 3);
              setAge(digits ? Number(digits) : undefined);
              setError(undefined);
            }}
            placeholder="Enter age"
            value={age?.toString() ?? ''}
          />

          <TextField
            error={
              attempted && city.trim().length < 2
                ? 'Enter your city.'
                : undefined
            }
            helperText="Used to show nearby events and circles."
            label="City *"
            maxLength={60}
            onChangeText={(value) => {
              setCity(value);
              setError(undefined);
            }}
            placeholder="Bengaluru"
            value={city}
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
            helperText="A short introduction for other members."
            label="About you"
            multiline
            onChangeText={setBio}
            placeholder="I enjoy badminton, books, and weekend workshops."
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
          {[...interestOptions, ...customInterests].map((interest) => {
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
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCustomInterestOpen((current) => !current);
              setError(undefined);
            }}
            style={[
              styles.interestChip,
              customInterestOpen && styles.interestChipSelected,
            ]}
          >
            <Text
              style={[
                styles.interestText,
                customInterestOpen && styles.interestTextSelected,
              ]}
            >
              Other
            </Text>
          </Pressable>
        </View>

        {customInterestOpen ? (
          <View style={styles.customInterestPanel}>
            <TextField
              autoCapitalize="words"
              label="Add another interest"
              maxLength={30}
              onChangeText={setCustomInterest}
              onSubmitEditing={addCustomInterest}
              placeholder="For example, photography"
              returnKeyType="done"
              value={customInterest}
            />
            <Pressable
              accessibilityRole="button"
              onPress={addCustomInterest}
              style={styles.addInterestButton}
            >
              <Text style={styles.addInterestText}>Add interest</Text>
            </Pressable>
          </View>
        ) : null}

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

      <Modal
        animationType="fade"
        onRequestClose={() => setPhotoSourceOpen(false)}
        transparent
        visible={photoSourceOpen}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setPhotoSourceOpen(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.photoSheet}>
            <View style={styles.photoSheetHeader}>
              <View>
                <Text style={styles.photoSheetTitle}>Add profile photo</Text>
                <Text style={styles.photoSheetSubtitle}>
                  Choose how you want to add it.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close photo options"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => setPhotoSourceOpen(false)}
                style={styles.closeButton}
              >
                <X color={colors.ink} size={20} strokeWidth={2.4} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => void chooseProfilePhoto('camera')}
              style={styles.photoOption}
            >
              <View style={styles.photoOptionIcon}>
                <Camera color={colors.secondary} size={22} strokeWidth={2.3} />
              </View>
              <View>
                <Text style={styles.photoOptionTitle}>Take a photo</Text>
                <Text style={styles.photoOptionMeta}>Use your camera now.</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => void chooseProfilePhoto('library')}
              style={styles.photoOption}
            >
              <View style={styles.photoOptionIcon}>
                <ImagePlus
                  color={colors.secondary}
                  size={22}
                  strokeWidth={2.3}
                />
              </View>
              <View>
                <Text style={styles.photoOptionTitle}>Choose a photo</Text>
                <Text style={styles.photoOptionMeta}>
                  Select one from your device.
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function UsernameAvailabilityMessage({
  availability,
}: {
  availability: UsernameAvailability;
}) {
  if (availability === 'idle') {
    return null;
  }

  if (availability === 'checking') {
    return (
      <View style={styles.availabilityRow}>
        <ActivityIndicator color={colors.muted} size="small" />
        <Text style={styles.availabilityHint}>Checking availability...</Text>
      </View>
    );
  }

  const available = availability === 'available';
  return (
    <View style={styles.availabilityRow}>
      {available ? (
        <CheckCircle2 color={colors.success} size={17} strokeWidth={2.5} />
      ) : (
        <XCircle color={colors.primaryDark} size={17} strokeWidth={2.5} />
      )}
      <Text
        style={
          available ? styles.availabilitySuccess : styles.availabilityError
        }
      >
        {available
          ? 'Username is available.'
          : availability === 'taken'
            ? 'Username is already taken.'
            : 'Could not check availability. Try again.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addInterestButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  addInterestText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  availabilityError: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
  },
  availabilityHint: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  availabilityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  availabilitySuccess: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: '700',
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
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  customInterestPanel: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(33, 26, 29, 0.36)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  photoOption: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  photoOptionIcon: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  photoOptionMeta: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: 2,
  },
  photoOptionTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  photoSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  photoSheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  photoSheetSubtitle: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: 3,
  },
  photoSheetTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
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
  usernameGroup: {
    gap: spacing.xs,
  },
});
