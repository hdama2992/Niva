import { Check, ChevronDown, MessageSquareText } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../constants/legal';
import { colors, radius, spacing, typography } from '../constants/theme';
type LoginScreenProps = {
  onContinue: (phone: string) => Promise<void>;
};

type Country = {
  code: string;
  dialCode: string;
  localDigits: number;
  name: string;
  placeholder: string;
};

const countries: Country[] = [
  {
    code: 'IN',
    dialCode: '+91',
    localDigits: 10,
    name: 'India',
    placeholder: '98765 43210',
  },
  {
    code: 'US',
    dialCode: '+1',
    localDigits: 10,
    name: 'United States',
    placeholder: '555 123 4567',
  },
  {
    code: 'GB',
    dialCode: '+44',
    localDigits: 10,
    name: 'United Kingdom',
    placeholder: '7123 456789',
  },
  {
    code: 'AE',
    dialCode: '+971',
    localDigits: 9,
    name: 'United Arab Emirates',
    placeholder: '50 123 4567',
  },
  {
    code: 'SG',
    dialCode: '+65',
    localDigits: 8,
    name: 'Singapore',
    placeholder: '8123 4567',
  },
];
export function LoginScreen({ onContinue }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardSubscription = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    });

    return () => keyboardSubscription.remove();
  }, []);

  const cleanPhone = (value: string) => value.replace(/\D/g, '');

  const continueToOtp = async () => {
    const localPhone = cleanPhone(phone.trim());

    if (localPhone.length !== selectedCountry.localDigits) {
      setError('Enter a valid phone number.');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    try {
      await onContinue(`${selectedCountry.dialCode}${localPhone}`);
    } catch (authError) {
      logSafeAuthError('Phone verification request failed', authError);
      setError(friendlyPhoneError(authError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
      >
        <ImageBackground
          imageStyle={styles.heroImage}
          resizeMode="cover"
          source={require('../../assets/login-friends-hero.webp')}
          style={styles.hero}
        >
          <View style={styles.brandGlass}>
            <Text style={styles.brand}>niva</Text>
          </View>
        </ImageBackground>
        <View style={styles.content}>
          <View style={styles.copy}>
            <Text style={styles.title}>Find plans you’ll look forward to.</Text>
            <Text style={styles.subtitle}>
              Meet people through thoughtful plans near you.
            </Text>
          </View>

          <View style={styles.phoneGroup}>
            <Text style={styles.label}>Log in or sign up</Text>
            <View style={[styles.phoneRow, error && styles.phoneRowError]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCountryPickerOpen(true)}
                style={styles.countryButton}
              >
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                <ChevronDown color={colors.muted} size={18} strokeWidth={2.4} />
              </Pressable>

              <TextInput
                accessibilityLabel="Phone number"
                autoComplete="tel"
                keyboardType="number-pad"
                maxLength={selectedCountry.localDigits}
                onChangeText={(value) => {
                  setPhone(
                    cleanPhone(value).slice(0, selectedCountry.localDigits),
                  );
                  if (error) {
                    setError(undefined);
                  }
                }}
                onFocus={() => {
                  requestAnimationFrame(() =>
                    scrollRef.current?.scrollToEnd({ animated: true }),
                  );
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({ animated: true }),
                    220,
                  );
                }}
                placeholder={selectedCountry.placeholder}
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                style={styles.phoneInput}
                textContentType="telephoneNumber"
                value={phone}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <PrimaryButton
            disabled={submitting}
            icon={
              submitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <MessageSquareText
                  color={colors.surface}
                  size={20}
                  strokeWidth={2.4}
                />
              )
            }
            label={submitting ? 'Starting verification...' : 'Continue'}
            onPress={() => void continueToOtp()}
          />
          <Text style={styles.consentText}>
            You can review Niva’s{' '}
            <Text
              accessibilityRole="link"
              onPress={
                () => void Linking.openURL(PRIVACY_POLICY_URL)
              }
              style={styles.consentLink}
            >
              Privacy Policy
            </Text>{' '}
            and{' '}
            <Text
              accessibilityRole="link"
              onPress={
                () => void Linking.openURL(TERMS_URL)
              }
              style={styles.consentLink}
            >
              Terms
            </Text>
            . You’ll be asked to accept them before creating your profile.
          </Text>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setCountryPickerOpen(false)}
        transparent
        visible={countryPickerOpen}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCountryPickerOpen(false)}
        >
          <Pressable style={styles.countrySheet}>
            <Text style={styles.sheetTitle}>Select country</Text>
            <FlatList
              data={countries}
              keyExtractor={(country) => country.code}
              renderItem={({ item }) => {
                const selected = item.code === selectedCountry.code;

                return (
                  <Pressable
                    onPress={() => {
                      setSelectedCountry(item);
                      setPhone('');
                      setError(undefined);
                      setCountryPickerOpen(false);
                    }}
                    style={styles.countryOption}
                  >
                    <View style={styles.countryOptionCopy}>
                      <Text style={styles.countryName}>{item.name}</Text>
                      <Text style={styles.countryMeta}>
                        {item.code} {item.dialCode}
                      </Text>
                    </View>
                    {selected ? (
                      <Check
                        color={colors.primary}
                        size={22}
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function friendlyPhoneError(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'That phone number is not supported. Check it and try again.';
    case 'auth/operation-not-allowed':
      return 'Phone sign-in is temporarily unavailable. Please try again later.';
    case 'auth/quota-exceeded':
    case 'auth/too-many-requests':
      return 'Too many attempts were made. Please wait and try again later.';
    case 'auth/network-request-failed':
      return 'Check your internet connection and try again.';
    default:
      return 'Unable to start phone verification. Please try again.';
  }
}

function logSafeAuthError(context: string, error: unknown) {
  if (!__DEV__) return;

  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : 'unknown';
  const name = error instanceof Error ? error.name : typeof error;

  console.warn(`[Niva auth] ${context}.`, { code, name });
}

const styles = StyleSheet.create({
  brand: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  brandGlass: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(23,52,91,0.55)',
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  consentLink: {
    color: colors.secondary,
    fontWeight: '800',
  },
  consentText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  copy: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  hero: {
    height: 260,
    justifyContent: 'flex-start',
    padding: spacing.lg,
  },
  heroImage: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  countryButton: {
    alignItems: 'center',
    borderRightColor: colors.border,
    borderRightWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  countryCode: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  countryMeta: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 3,
  },
  countryName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  countryOption: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  countryOptionCopy: {
    flex: 1,
  },
  countrySheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  dialCode: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '700',
  },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  label: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '700',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(36, 23, 28, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  phoneGroup: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    width: '100%',
  },
  phoneInput: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  phoneRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  phoneRowError: {
    borderColor: colors.primaryDark,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
    lineHeight: 44,
  },
});
