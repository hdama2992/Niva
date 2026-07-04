import { ArrowLeft, KeyRound, LogIn } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { colors, radius, spacing, typography } from '../constants/theme';

type OtpScreenProps = {
  phone: string;
  onBack: () => void;
  onVerified: () => void;
};

export function OtpScreen({ phone, onBack, onVerified }: OtpScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();

  const verifyCode = () => {
    if (code.length !== 6) {
      setError('Enter the six-digit code.');
      return;
    }

    setError(undefined);
    onVerified();
  };

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <ArrowLeft color={colors.ink} size={22} strokeWidth={2.3} />
      </Pressable>

      <View style={styles.header}>
        <View style={styles.iconPlate}>
          <KeyRound color={colors.primary} size={32} strokeWidth={2.3} />
        </View>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>Enter the six-digit code sent to {phone}.</Text>
      </View>

      <TextField
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
        value={code}
      />

      <View style={styles.footer}>
        <PrimaryButton
          disabled={code.length !== 6}
          icon={<LogIn color={colors.surface} size={20} strokeWidth={2.4} />}
          label="Verify"
          onPress={verifyCode}
        />
      </View>
    </View>
  );
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
});
