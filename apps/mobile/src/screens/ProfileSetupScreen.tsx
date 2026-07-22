import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Camera,
  ChevronDown,
  ImagePlus,
  Info,
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
import { supportedCities } from '../constants/locations';
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
  'Photography',
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
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [photoTipsOpen, setPhotoTipsOpen] = useState(false);
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
      bio.trim().length >= 10 &&
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
      bio,
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

  const detailsComplete =
    displayName.trim().length >= 2 &&
    city.trim().length >= 2 &&
    bio.trim().length >= 10 &&
    age !== undefined &&
    age >= 18 &&
    age <= 100 &&
    languages.length > 0 &&
    (mode === 'edit' ||
      (usernamePattern.test(profileUsername.trim()) &&
        usernameAvailability === 'available'));

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

    if (mode === 'create' && step === 1) {
      if (!detailsComplete) {
        return;
      }
      setAttempted(false);
      setStep(2);
      return;
    }

    if (mode === 'create' && step === 2) {
      if (!selectedEnoughInterests) {
        return;
      }
      setAttempted(false);
      setStep(3);
      return;
    }

    if (!canContinue) {
      return;
    }

    setSubmitting(true);
    try {
      await onComplete(
        {
          displayName: displayName.trim(),
          city: city.trim(),
          bio: bio.trim(),
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
      {mode === 'edit' || step > 1 ? (
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              if (mode === 'edit') {
                onBack?.();
              } else {
                setAttempted(false);
                setStep((current) => (current === 3 ? 2 : 1));
              }
            }}
            style={styles.backButton}
          >
            <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
          </Pressable>
          <Text style={styles.topBarTitle}>
            {mode === 'edit' ? 'Profile' : `Profile · ${step} of 3`}
          </Text>
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
          ) : step === 1 ? (
            <Text style={styles.eyebrow}>Profile · {step} of 3</Text>
          ) : null}
          <Text style={styles.title}>
            {mode === 'edit'
              ? 'Edit your profile'
              : step === 1
                ? 'Tell us about you'
                : step === 2
                  ? 'What are you into?'
                  : 'Finish with a profile photo'}
          </Text>
          {mode === 'edit' || step === 3 ? (
            <Text style={styles.subtitle}>
              {mode === 'edit'
                ? 'Keep your details up to date.'
                : 'Add a clear photo so members can recognise you.'}
            </Text>
          ) : null}
        </View>

        {mode === 'edit' || step === 3 ? (
          <>
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
                  <Camera
                    color={colors.secondary}
                    size={24}
                    strokeWidth={2.3}
                  />
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
            {mode === 'create' ? (
              <View style={styles.photoActionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void chooseProfilePhoto('camera')}
                  style={styles.photoActionButton}
                >
                  <Camera color={colors.primary} size={21} strokeWidth={2.3} />
                  <Text style={styles.photoActionText}>Take a photo</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void chooseProfilePhoto('library')}
                  style={styles.photoActionButton}
                >
                  <ImagePlus
                    color={colors.primary}
                    size={21}
                    strokeWidth={2.3}
                  />
                  <Text style={styles.photoActionText}>Choose a photo</Text>
                </Pressable>
              </View>
            ) : null}
            <Text style={styles.photoPrivacyTitle}>Public profile photo</Text>
            <Text style={styles.photoPrivacyText}>
              Members in your plans can see it.
            </Text>
            {mode === 'create' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setPhotoTipsOpen(true)}
                style={styles.photoTipsButton}
              >
                <Info color={colors.primary} size={19} strokeWidth={2.3} />
                <Text style={styles.photoTipsButtonText}>View photo tips</Text>
              </Pressable>
            ) : null}
            {attempted && !hasProfilePhoto ? (
              <Text style={styles.fieldError}>Add a profile photo.</Text>
            ) : null}
          </>
        ) : null}

        {mode === 'edit' || step === 1 ? (
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
                  helperText="Your unique @handle in profiles and chat."
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
              helperText="The name other members will see."
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

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>City *</Text>
              <Text style={styles.fieldMeta}>
                Choose a city where Niva currently has activities.
              </Text>
              <Pressable
                accessibilityLabel="Select city"
                accessibilityRole="button"
                onPress={() => setCityPickerOpen(true)}
                style={[
                  styles.selectField,
                  attempted && !city && styles.selectFieldError,
                ]}
              >
                <Text
                  style={city ? styles.selectValue : styles.selectPlaceholder}
                >
                  {city || 'Select your city'}
                </Text>
                <ChevronDown color={colors.muted} size={20} strokeWidth={2.4} />
              </Pressable>
              {attempted && !city ? (
                <Text style={styles.fieldError}>Select your city.</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Languages *</Text>
              <Text style={styles.fieldMeta}>
                Select every language you use.
              </Text>
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
              error={
                attempted && bio.trim().length < 10
                  ? 'Write at least 10 characters about yourself.'
                  : undefined
              }
              helperText="A short introduction other members can read."
              label="About you *"
              multiline
              onChangeText={setBio}
              placeholder="I enjoy badminton, books, and weekend workshops."
              style={styles.bioInput}
              value={bio}
            />
          </View>
        ) : null}

        {mode === 'edit' || step === 2 ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Interests *</Text>
                <Text style={styles.sectionMeta}>
                  {interests.length} selected · minimum 3
                </Text>
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
                  autoComplete="off"
                  autoCorrect={false}
                  label="Add another interest"
                  maxLength={30}
                  onChangeText={setCustomInterest}
                  onSubmitEditing={addCustomInterest}
                  placeholder="For example, photography"
                  returnKeyType="done"
                  spellCheck={false}
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
          </>
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
              ? mode === 'create' && step === 3
                ? 'Uploading photo...'
                : 'Saving...'
              : mode === 'edit'
                ? 'Save changes'
                : step === 3
                  ? 'Finish profile'
                  : 'Continue'
          }
          onPress={() => void continueToDeclaration()}
        />
        {mode === 'create' && step === 3 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setAttempted(false);
              setStep(1);
            }}
            style={styles.backToDetails}
          >
            <Text style={styles.backToDetailsText}>
              Back to profile details
            </Text>
          </Pressable>
        ) : null}
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

      <Modal
        animationType="fade"
        onRequestClose={() => setPhotoTipsOpen(false)}
        transparent
        visible={photoTipsOpen}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setPhotoTipsOpen(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.photoSheet}>
            <View style={styles.photoSheetHeader}>
              <View>
                <Text style={styles.photoSheetTitle}>Profile photo tips</Text>
                <Text style={styles.photoSheetSubtitle}>
                  Help members recognise you in person.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close photo tips"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => setPhotoTipsOpen(false)}
                style={styles.closeButton}
              >
                <X color={colors.ink} size={20} strokeWidth={2.4} />
              </Pressable>
            </View>
            <View style={styles.photoGuidance}>
              {[
                'Use a recent solo photo',
                'Keep your face clearly visible',
                'Choose good natural light',
                'Avoid heavy filters',
              ].map((item) => (
                <View key={item} style={styles.photoGuidanceRow}>
                  <CheckCircle2 color={colors.success} size={20} />
                  <Text style={styles.photoGuidanceText}>{item}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setCityPickerOpen(false)}
        transparent
        visible={cityPickerOpen}
      >
        <Pressable
          onPress={() => setCityPickerOpen(false)}
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.citySheet}>
            <Text style={styles.sheetTitle}>Select your city</Text>
            <Text style={styles.sheetSubtitle}>
              Only cities with active Niva operations are available.
            </Text>
            {supportedCities.map((option) => {
              const selected = city === option.name;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option.name}
                  onPress={() => {
                    setCity(option.name);
                    setCityPickerOpen(false);
                    setError(undefined);
                  }}
                  style={styles.cityOption}
                >
                  <View>
                    <Text style={styles.cityOptionName}>{option.name}</Text>
                    <Text style={styles.cityOptionStatus}>{option.status}</Text>
                  </View>
                  {selected ? (
                    <Check color={colors.primary} size={22} strokeWidth={2.5} />
                  ) : null}
                </Pressable>
              );
            })}
            <Text style={styles.cityComingSoon}>
              More cities will appear here as Niva launches locally.
            </Text>
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
  backToDetails: {
    alignItems: 'center',
    minHeight: 48,
    paddingTop: spacing.md,
  },
  backToDetailsText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '800',
  },
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
  cityComingSoon: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    padding: spacing.lg,
  },
  cityOption: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 68,
    paddingHorizontal: spacing.lg,
  },
  cityOptionName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  cityOptionStatus: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: 3,
  },
  citySheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 64,
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
  selectField: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  selectFieldError: {
    borderColor: colors.primaryDark,
  },
  selectPlaceholder: {
    color: colors.muted,
    fontSize: typography.body,
  },
  selectValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '700',
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
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
  photoGuidance: {
    backgroundColor: colors.glass,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  photoActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoActionText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  photoGuidanceRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 54,
  },
  photoGuidanceText: {
    color: colors.ink,
    fontSize: typography.body,
  },
  photoPrivacyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  photoPrivacyTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  photoTipsButton: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  photoTipsButtonText: {
    color: colors.primary,
    fontSize: typography.small,
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
