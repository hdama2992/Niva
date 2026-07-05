import { ArrowRight, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import {
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
  onComplete: (username: string) => void;
};

const usernamePattern = /^[a-z0-9_]{3,20}$/;

export function UsernameScreen({ phone, onComplete }: UsernameScreenProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string>();

  const continueToHome = () => {
    const normalizedUsername = username.trim();

    if (!usernamePattern.test(normalizedUsername)) {
      setError('Use 3-20 lowercase letters, numbers, or underscores.');
      return;
    }

    onComplete(normalizedUsername);
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
            if (error) {
              setError(undefined);
            }
          }}
          placeholder="yourname"
          value={username}
        />

        <Text style={styles.verifiedPhone}>Verified phone: {phone}</Text>

        <PrimaryButton
          disabled={!usernamePattern.test(username.trim())}
          icon={
            <ArrowRight color={colors.surface} size={20} strokeWidth={2.4} />
          }
          label="Continue"
          onPress={continueToHome}
        />
      </View>
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
