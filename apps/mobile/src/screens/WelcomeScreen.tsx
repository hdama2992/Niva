import {
  CalendarCheck,
  Compass,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';

type WelcomeScreenProps = {
  city: string;
  displayName: string;
  onContinue: () => Promise<void> | void;
};

export function WelcomeScreen({
  city,
  displayName,
  onContinue,
}: WelcomeScreenProps) {
  const [continuing, setContinuing] = useState(false);
  const steps: Array<{
    icon: ReactNode;
    text: string;
    title: string;
  }> = [
    {
      icon: <Compass color={colors.primary} size={23} strokeWidth={2.4} />,
      title: 'Explore',
      text: `Find small events and recurring circles around ${city}.`,
    },
    {
      icon: (
        <ShieldCheck color={colors.secondary} size={23} strokeWidth={2.4} />
      ),
      title: 'Join securely',
      text: 'Verification begins only when you request to join your first plan.',
    },
    {
      icon: <CalendarCheck color={colors.info} size={23} strokeWidth={2.4} />,
      title: 'Plans',
      text: 'Keep joined activities, schedules, and group chats together.',
    },
  ];

  const continueToNiva = async () => {
    setContinuing(true);
    try {
      await onContinue();
    } finally {
      setContinuing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.brandMark}>
        <UsersRound color={colors.surface} size={30} strokeWidth={2.4} />
      </View>
      <Text style={styles.eyebrow}>Niva</Text>
      <Text style={styles.title}>Welcome, {displayName}</Text>
      <Text style={styles.subtitle}>
        Find people through activities you will actually enjoy showing up for.
      </Text>

      <View style={styles.steps}>
        {steps.map((step) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={styles.stepIcon}>{step.icon}</View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          disabled={continuing}
          icon={<Compass color={colors.surface} size={20} strokeWidth={2.4} />}
          label={continuing ? 'Opening Niva...' : 'Start exploring'}
          onPress={() => void continueToNiva()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 64,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  stepCopy: {
    flex: 1,
  },
  stepIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  steps: {
    borderBottomColor: colors.border,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    gap: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
  },
  stepText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 3,
  },
  stepTitle: {
    color: colors.ink,
    fontSize: typography.body,
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
});
