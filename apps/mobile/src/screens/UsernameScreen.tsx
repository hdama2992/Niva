import {
  ArrowRight,
  CheckCircle2,
  UserRound,
  XCircle,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { colors, radius, spacing, typography } from '../constants/theme';

type UsernameScreenProps = {
  phone: string;
  onCheckAvailability: (
    username: string,
  ) => Promise<{ available: boolean; username: string }>;
  onComplete: (username: string) => Promise<void>;
};

const usernamePattern = /^[a-z0-9_]{3,20}$/;

type Availability = 'available' | 'checking' | 'idle' | 'taken' | 'unavailable';

export function UsernameScreen({
  phone,
  onCheckAvailability,
  onComplete,
}: UsernameScreenProps) {
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState<Availability>('idle');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const normalizedUsername = username.trim();

    if (!usernamePattern.test(normalizedUsername)) {
      setAvailability('idle');
      return;
    }

    setAvailability('checking');
    let active = true;
    const timer = setTimeout(() => {
      void onCheckAvailability(normalizedUsername)
        .then(({ available }) => {
          if (active) {
            setAvailability(available ? 'available' : 'taken');
          }
        })
        .catch(() => {
          if (active) {
            setAvailability('unavailable');
          }
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [onCheckAvailability, username]);

  const continueToHome = async () => {
    const normalizedUsername = username.trim();

    if (!usernamePattern.test(normalizedUsername)) {
      setError('Use 3-20 lowercase letters, numbers, or underscores.');
      return;
    }

    if (availability !== 'available') {
      setError(
        availability === 'taken'
          ? 'That username is already taken. Try another.'
          : 'Wait for the username check to finish.',
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(undefined);
      await onComplete(normalizedUsername);
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to save that username.';
      setAvailability(
        message.toLowerCase().includes('taken') ? 'taken' : 'unavailable',
      );
      setError(message);
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
          <UserRound color={colors.primary} size={36} strokeWidth={2.2} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Create your username</Text>
          <Text style={styles.subtitle}>
            This is how people will recognize you in Niva.
          </Text>
        </View>

        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          error={error}
          label="Username"
          onChangeText={(value) => {
            setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
            setAvailability('idle');
            if (error) {
              setError(undefined);
            }
          }}
          placeholder="yourname"
          value={username}
        />

        <AvailabilityMessage availability={availability} />

        <Text style={styles.verifiedPhone}>Verified phone: {phone}</Text>

        <PrimaryButton
          disabled={
            availability !== 'available' ||
            submitting ||
            !usernamePattern.test(username.trim())
          }
          icon={
            <ArrowRight color={colors.surface} size={20} strokeWidth={2.4} />
          }
          label={submitting ? 'Saving username...' : 'Continue'}
          onPress={() => void continueToHome()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function AvailabilityMessage({ availability }: { availability: Availability }) {
  if (availability === 'idle') {
    return (
      <Text style={styles.availabilityHint}>
        Use 3-20 lowercase letters, numbers, or underscores.
      </Text>
    );
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
    marginTop: spacing.xs,
  },
  availabilitySuccess: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
  verifiedPhone: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
});
