import { ArrowLeft, KeyRound, LogIn } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { colors, radius, spacing, typography } from '../constants/theme';
import { MobileAuthMode } from '../services/mobile-auth';

const resendDelaySeconds = 60;

type OtpScreenProps = {
  authMode: MobileAuthMode;
  phone: string;
  onBack: () => void;
  onResend: () => Promise<void>;
  onVerified: (code: string) => Promise<void>;
};

export function OtpScreen({
  authMode,
  phone,
  onBack,
  onResend,
  onVerified,
}: OtpScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [resendSeconds, setResendSeconds] = useState(resendDelaySeconds);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(
      () => setResendSeconds((seconds) => Math.max(seconds - 1, 0)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Enter the six-digit code.');
      return;
    }

    setSubmitting(true);
    setError(undefined);
    try {
      await onVerified(code);
    } catch (verifyError) {
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
    } catch (resendError) {
      setError(
        friendlyOtpError(resendError, 'Unable to resend the code.'),
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={styles.backButton}
      >
        <ArrowLeft color={colors.ink} size={22} strokeWidth={2.3} />
      </Pressable>

      <View style={styles.header}>
        <View style={styles.iconPlate}>
          <KeyRound color={colors.primary} size={32} strokeWidth={2.3} />
        </View>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          {authMode === 'firebase'
            ? `Enter the six-digit code sent to ${phone}.`
            : `Enter the six-digit code to continue as ${phone}.`}
        </Text>
      </View>

      <TextField
        autoComplete="sms-otp"
        error={error}
        keyboardType="number-pad"
        label="Verification code"
        maxLength={6}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, ''));
          if (error) {
            setError(undefined);
          }
        }}
        placeholder="000000"
        textContentType="oneTimeCode"
        value={code}
      />

      <View style={styles.footer}>
        <PrimaryButton
          disabled={code.length !== 6 || submitting}
          icon={
            submitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <LogIn color={colors.surface} size={20} strokeWidth={2.4} />
            )
          }
          label={submitting ? 'Verifying...' : 'Verify'}
          onPress={() => void verifyCode()}
        />
        {authMode === 'firebase' ? (
          <View style={styles.resendRow}>
            <Text style={styles.resendHint}>Didn&apos;t receive the code?</Text>
            <Pressable
              accessibilityRole="button"
              disabled={resendSeconds > 0 || resending}
              onPress={() => void resendCode()}
            >
              <Text
                style={[
                  styles.resendAction,
                  (resendSeconds > 0 || resending) && styles.resendDisabled,
                ]}
              >
                {resending
                  ? 'Sending...'
                  : resendSeconds > 0
                    ? `Resend in ${resendSeconds}s`
                    : 'Resend code'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function friendlyOtpError(error: unknown, fallback: string) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';

  switch (code) {
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

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 44,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  iconPlate: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 64,
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
  resendAction: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '800',
  },
  resendDisabled: {
    color: colors.muted,
  },
  resendHint: {
    color: colors.muted,
    fontSize: typography.small,
  },
  resendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
});
