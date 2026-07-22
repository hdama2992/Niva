import { ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';
const resendDelaySeconds = 60;

type OtpScreenProps = {
  phone: string;
  onBack: () => void;
  onResend: () => Promise<void>;
  onVerified: (code: string) => Promise<void>;
};

export function OtpScreen({
  phone,
  onBack,
  onResend,
  onVerified,
}: OtpScreenProps) {
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [resendSeconds, setResendSeconds] = useState(resendDelaySeconds);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(
      () => setResendSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(
        () => scrollRef.current?.scrollTo({ animated: true, y: 48 }),
        180,
      );
    });

    return () => subscription.remove();
  }, []);

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Enter the complete six-digit code.');
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      await onVerified(code);
    } catch (verifyError) {
      logSafeAuthError('OTP verification failed', verifyError);
      setError(friendlyOtpError(verifyError, 'Unable to verify this code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    setError(undefined);
    try {
      await onResend();
      setResendSeconds(resendDelaySeconds);
      inputRef.current?.focus();
    } catch (resendError) {
      logSafeAuthError('OTP resend failed', resendError);
      setError(friendlyOtpError(resendError, 'Unable to resend the code.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <DeckTopBar onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Enter the 6-digit code</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.subtitle}>Sent by SMS to {phone}</Text>
            <Pressable accessibilityRole="button" onPress={onBack}>
              <Text style={styles.change}>Change</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityLabel="Verification code"
            accessibilityRole="button"
            onPress={() => inputRef.current?.focus()}
            style={styles.codeRow}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  index === Math.min(code.length, 5) && styles.codeBoxActive,
                ]}
              >
                <Text style={styles.codeDigit}>{code[index] ?? ''}</Text>
              </View>
            ))}
            <TextInput
              ref={inputRef}
              autoComplete="sms-otp"
              autoFocus
              caretHidden
              importantForAutofill="yes"
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, ''));
                setError(undefined);
              }}
              style={styles.hiddenInput}
              textContentType="oneTimeCode"
              value={code}
            />
          </Pressable>

          <View style={styles.safetyRow}>
            <View style={styles.safetyIcon}>
              <ShieldCheck color={colors.success} size={20} />
            </View>
            <Text style={styles.safetyText}>
              Niva never asks you to share this code with anyone.
            </Text>
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <View style={styles.resendRow}>
            {resendSeconds > 0 ? (
              <Text style={styles.resendHint}>
                Resend available in{' '}
                <Text style={styles.resendStrong}>
                  {formatTimer(resendSeconds)}
                </Text>
              </Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={resending}
                onPress={() => void resendCode()}
              >
                <Text style={styles.resendAction}>
                  {resending ? 'Sending another code…' : 'Resend code'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            disabled={code.length !== 6 || submitting}
            icon={
              submitting ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <ArrowRight color={colors.surface} size={22} />
              )
            }
            label={submitting ? 'Verifying…' : 'Verify and continue'}
            onPress={() => void verifyCode()}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => inputRef.current?.focus()}
            style={styles.helpButton}
          >
            <Text style={styles.helpText}>Having trouble?</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function formatTimer(seconds: number) {
  return `00:${String(seconds).padStart(2, '0')}`;
}

function friendlyOtpError(error: unknown, fallback: string) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
  switch (code) {
    case 'niva/session-unavailable':
      return 'Your phone was verified, but Niva could not finish signing you in. Check the connection and try again.';
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'This code has expired. Request a new one.';
    case 'auth/invalid-phone-number':
      return 'That phone number is not supported. Go back and check it.';
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Check the SMS and try again.';
    case 'auth/quota-exceeded':
    case 'auth/too-many-requests':
      return 'Too many attempts were made. Please wait and try again later.';
    default:
      return `${fallback} Try again.`;
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
  change: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '800',
  },
  codeBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    height: 66,
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: colors.success, borderWidth: 2 },
  codeDigit: { color: colors.primaryDark, fontSize: 29, fontWeight: '700' },
  codeRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: spacing.xl,
    position: 'relative',
  },
  content: { paddingHorizontal: spacing.lg },
  error: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: { gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.md },
  helpButton: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  helpText: { color: '#1769B0', fontSize: typography.body, fontWeight: '800' },
  hiddenInput: {
    height: '100%',
    left: 0,
    opacity: 0.01,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  phoneRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  resendAction: {
    color: '#1769B0',
    fontSize: typography.body,
    fontWeight: '800',
  },
  resendHint: { color: colors.muted, fontSize: typography.body },
  resendRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
  },
  resendStrong: { color: colors.primaryDark, fontWeight: '800' },
  safetyIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  safetyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  safetyText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 19,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  scrollContent: { flexGrow: 1 },
  subtitle: { color: colors.muted, fontSize: typography.body },
  title: {
    color: colors.primaryDark,
    fontSize: typography.title,
    fontWeight: '900',
    lineHeight: 44,
    marginTop: spacing.lg,
  },
});
