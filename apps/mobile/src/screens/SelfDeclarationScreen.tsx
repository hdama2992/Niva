import { Check, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';

type SelfDeclarationScreenProps = {
  displayName: string;
  onAccept: () => void;
};

export function SelfDeclarationScreen({
  displayName,
  onAccept,
}: SelfDeclarationScreenProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.iconPlate}>
          <ShieldCheck color={colors.primary} size={36} strokeWidth={2.2} />
        </View>
        <Text style={styles.eyebrow}>Community trust</Text>
        <Text style={styles.title}>One clear promise</Text>
        <Text style={styles.subtitle}>
          {displayName}, Niva is for women and people who identify as women to
          build safe real-world friendships.
        </Text>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => setAccepted((value) => !value)}
        style={[styles.declarationBox, accepted && styles.declarationBoxActive]}
      >
        <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
          {accepted ? (
            <Check color={colors.surface} size={18} strokeWidth={3} />
          ) : null}
        </View>
        <Text style={styles.declarationText}>
          I confirm that I am a woman or identify as a woman, and I understand
          Niva is a women-centered friendship community.
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <PrimaryButton
          disabled={!accepted}
          icon={
            <ShieldCheck color={colors.surface} size={20} strokeWidth={2.4} />
          }
          label="Accept and continue"
          onPress={onAccept}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  declarationBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  declarationBoxActive: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.primary,
  },
  declarationText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 24,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
  },
  iconPlate: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    height: 70,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 70,
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
