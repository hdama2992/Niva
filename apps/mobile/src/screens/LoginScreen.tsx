import { ShieldCheck, UsersRound } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { colors, radius, spacing, typography } from '../constants/theme';

type LoginScreenProps = {
  onContinue: (phone: string) => void;
};

export function LoginScreen({ onContinue }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  const cleanPhone = (value: string) => value.replace(/[^\d+]/g, '');

  const continueToOtp = () => {
    const normalizedPhone = cleanPhone(phone.trim());

    if (normalizedPhone.length < 8 || !normalizedPhone.startsWith('+')) {
      setError('Enter a valid phone number with country code.');
      return;
    }

    setError(undefined);
    onContinue(normalizedPhone);
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
          <Text style={styles.subtitle}>Enter your phone number.</Text>
        </View>

        <TextField
          autoComplete="tel"
          error={error}
          keyboardType="phone-pad"
          label="Phone number"
          onChangeText={(value) => {
            setPhone(cleanPhone(value));
            if (error) {
              setError(undefined);
            }
          }}
          placeholder="+91 98765 43210"
          textContentType="telephoneNumber"
          value={phone}
        />

        <PrimaryButton
          icon={<ShieldCheck color={colors.surface} size={20} strokeWidth={2.4} />}
          label="Continue"
          onPress={continueToOtp}
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
    fontSize: typography.title,
    fontWeight: '800',
    lineHeight: 44,
  },
});
