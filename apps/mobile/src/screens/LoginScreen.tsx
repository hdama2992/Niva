import {
  Check,
  ChevronDown,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';
import { MobileAuthMode } from '../services/mobile-auth';

type LoginScreenProps = {
  authMode: MobileAuthMode;
  onContinue: (phone: string) => Promise<void>;
  onVerifyPhoneNumber: () => void;
  pnvAvailable: boolean;
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
const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL;

export function LoginScreen({
  authMode,
  onContinue,
  onVerifyPhoneNumber,
  pnvAvailable,
}: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

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
      setError(
        authError instanceof Error
          ? authError.message
          : 'Unable to start phone verification. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconPlate}>
          <UsersRound color={colors.primary} size={40} strokeWidth={2.2} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Find your people.</Text>
          <Text style={styles.subtitle}>
            {pnvAvailable
              ? 'Verify the phone number on this device in one secure step.'
              : 'Your phone number helps keep every Niva circle safer and more accountable.'}
          </Text>
        </View>

        {pnvAvailable ? (
          <View style={styles.pnvSection}>
            <View style={styles.pnvCopy}>
              <View style={styles.pnvIcon}>
                <Smartphone
                  color={colors.secondary}
                  size={20}
                  strokeWidth={2.4}
                />
              </View>
              <View style={styles.pnvTextGroup}>
                <Text style={styles.pnvTitle}>Verify from your SIM</Text>
                <Text style={styles.pnvText}>
                  Your mobile carrier confirms the number after you consent. No
                  SMS code is needed.
                </Text>
              </View>
            </View>
            <PrimaryButton
              icon={
                <ShieldCheck
                  color={colors.surface}
                  size={20}
                  strokeWidth={2.4}
                />
              }
              label="Verify my phone number"
              onPress={onVerifyPhoneNumber}
            />
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or use SMS</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>
        ) : null}

        <View style={styles.phoneGroup}>
          <Text style={styles.label}>Phone number</Text>
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
          label={
            submitting
              ? 'Starting verification...'
              : pnvAvailable
                ? 'Text me a code'
                : 'Continue securely'
          }
          onPress={() => void continueToOtp()}
        />
        <Text style={styles.consentText}>
          By continuing, you agree to receive an authentication SMS. Firebase
          may process your phone number to prevent abuse. Standard SMS rates may
          apply.{' '}
          <Text
            accessibilityRole="link"
            onPress={
              privacyPolicyUrl
                ? () => void Linking.openURL(privacyPolicyUrl)
                : undefined
            }
            style={styles.consentLink}
          >
            Privacy Policy
          </Text>{' '}
          and{' '}
          <Text
            accessibilityRole="link"
            onPress={
              termsUrl ? () => void Linking.openURL(termsUrl) : undefined
            }
            style={styles.consentLink}
          >
            Terms
          </Text>
          .
        </Text>
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
  iconPlate: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 72,
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
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dividerLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
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
  pnvCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  pnvIcon: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  pnvSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  pnvText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: 2,
  },
  pnvTextGroup: {
    flex: 1,
  },
  pnvTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
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
