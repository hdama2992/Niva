import { Camera, CheckCircle2, UploadCloud } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';

type SelfieUploadScreenProps = {
  displayName: string;
  joiningTitle?: string;
  onSubmit: (selfieUrl: string) => void;
};

const demoSelfieUrl = 'https://niva.local/selfies/current-user.jpg';

export function SelfieUploadScreen({
  displayName,
  joiningTitle,
  onSubmit,
}: SelfieUploadScreenProps) {
  const [selfieSelected, setSelfieSelected] = useState(false);

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.iconPlate}>
          <Camera color={colors.secondary} size={36} strokeWidth={2.2} />
        </View>
        <Text style={styles.eyebrow}>Required to join</Text>
        <Text style={styles.title}>Verify before joining</Text>
        <Text style={styles.subtitle}>
          {joiningTitle
            ? `Submit a current selfie before requesting to join ${joiningTitle}.`
            : 'Submit a current selfie before requesting to join events or circles.'}{' '}
          This checks real-person and profile consistency, not gender from
          appearance.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setSelfieSelected(true)}
        style={[styles.uploadBox, selfieSelected && styles.uploadBoxSelected]}
      >
        {selfieSelected ? (
          <CheckCircle2 color={colors.success} size={42} strokeWidth={2.2} />
        ) : (
          <UploadCloud color={colors.secondary} size={42} strokeWidth={2.2} />
        )}
        <View style={styles.uploadCopy}>
          <Text style={styles.uploadTitle}>
            {selfieSelected
              ? 'Selfie selected'
              : `Choose selfie, ${displayName}`}
          </Text>
          <Text style={styles.uploadText}>
            {selfieSelected
              ? 'Ready for manual review.'
              : 'Use a clear, recent photo with your face visible.'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.checks}>
        <Text style={styles.check}>Real face visible</Text>
        <Text style={styles.check}>Good image quality</Text>
        <Text style={styles.check}>Not a screenshot or fake profile image</Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          disabled={!selfieSelected}
          icon={
            <UploadCloud color={colors.surface} size={20} strokeWidth={2.4} />
          }
          label="Submit for review"
          onPress={() => onSubmit(demoSelfieUrl)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  checks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
  },
  iconPlate: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
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
  uploadBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    minHeight: 116,
    padding: spacing.md,
  },
  uploadBoxSelected: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  uploadCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  uploadText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  uploadTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
