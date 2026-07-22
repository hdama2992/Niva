import { Check, FileCheck2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../constants/legal';
import { colors, radius, spacing, typography } from '../constants/theme';

type LegalAcceptanceScreenProps = {
  onAccept: () => Promise<void>;
  onBack?: () => void;
};

export function LegalAcceptanceScreen({
  onAccept,
  onBack,
}: LegalAcceptanceScreenProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const acceptPolicies = async () => {
    setSubmitting(true);
    try {
      await onAccept();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack ?? (() => undefined)} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <FileCheck2 color={colors.primary} size={30} strokeWidth={2.2} />
        </View>
        <Text style={styles.eyebrow}>ONE LAST STEP</Text>
        <Text style={styles.title}>Review Niva’s policies</Text>
        <Text style={styles.subtitle}>
          Please confirm that you’re eligible to use Niva and accept the legal
          documents before creating your profile.
        </Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          onPress={() => setAccepted((value) => !value)}
          style={styles.agreementRow}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
            {accepted ? (
              <Check color={colors.surface} size={19} strokeWidth={3} />
            ) : null}
          </View>
          <Text style={styles.agreementText}>
            I am 18 or older. I agree to Niva’s{' '}
            <Text
              accessibilityRole="link"
              onPress={() => void openPolicy(TERMS_URL, 'Terms of Service')}
              style={styles.agreementLink}
            >
              Terms of Service
            </Text>{' '}
            and acknowledge the{' '}
            <Text
              accessibilityRole="link"
              onPress={() =>
                void openPolicy(PRIVACY_POLICY_URL, 'Privacy Policy')
              }
              style={styles.agreementLink}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </Pressable>

        <PrimaryButton
          disabled={!accepted || submitting}
          icon={
            submitting ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : undefined
          }
          label={submitting ? 'Saving...' : 'Agree and continue'}
          onPress={() => void acceptPolicies()}
        />
      </View>
    </View>
  );
}

async function openPolicy(url: string | undefined, label: string) {
  if (!url) {
    Alert.alert(`${label} unavailable`, 'The policy URL is not configured.');
    return;
  }
  await Linking.openURL(url);
}

const styles = StyleSheet.create({
  agreementLink: {
    color: '#1769B0',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  agreementRow: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  agreementText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.body,
    lineHeight: 24,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.muted,
    borderRadius: 7,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
    lineHeight: 35,
    marginTop: spacing.sm,
  },
});
