import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';
import { chooseSelfie, SelectedImage, takeSelfie } from '../services/media';

type SelfieUploadScreenProps = {
  displayName: string;
  joiningTitle?: string;
  onBack: () => void;
  onSubmit: (image: SelectedImage) => Promise<void> | void;
};

export function SelfieUploadScreen({
  displayName,
  joiningTitle,
  onBack,
  onSubmit,
}: SelfieUploadScreenProps) {
  const [selfie, setSelfie] = useState<SelectedImage>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const selectSelfie = async (source: 'camera' | 'library') => {
    try {
      const selected =
        source === 'camera' ? await takeSelfie() : await chooseSelfie();
      setSelfie(selected);
      setError(undefined);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : 'Unable to select a selfie.',
      );
    }
  };

  const submit = async () => {
    if (!selfie) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(selfie);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to submit your selfie.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={styles.backButton}
      >
        <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
      </Pressable>
      <View>
        <View style={styles.iconPlate}>
          <Camera color={colors.secondary} size={36} strokeWidth={2.2} />
        </View>
        <Text style={styles.eyebrow}>Required to join</Text>
        <Text style={styles.title}>Verify before joining</Text>
        <Text style={styles.subtitle}>
          {joiningTitle
            ? `Take a clear, recent selfie before requesting to join ${joiningTitle}.`
            : 'Take a clear, recent selfie before requesting to join events or circles.'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => void selectSelfie('camera')}
        style={[styles.uploadBox, selfie && styles.uploadBoxSelected]}
      >
        {selfie ? (
          <Image source={{ uri: selfie.uri }} style={styles.selfiePreview} />
        ) : (
          <Camera color={colors.secondary} size={42} strokeWidth={2.2} />
        )}
        <View style={styles.uploadCopy}>
          <Text style={styles.uploadTitle}>
            {selfie ? 'Selfie selected' : `Take a selfie, ${displayName}`}
          </Text>
          <Text style={styles.uploadText}>
            {selfie
              ? 'Your selfie is ready to submit.'
              : 'Use a clear, recent photo with your face visible.'}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => void selectSelfie('library')}
        style={styles.libraryButton}
      >
        <ImageIcon color={colors.secondary} size={18} strokeWidth={2.3} />
        <Text style={styles.libraryButtonText}>Choose from library</Text>
      </Pressable>

      <View style={styles.privacyNote}>
        <ShieldCheck color={colors.secondary} size={21} strokeWidth={2.4} />
        <Text style={styles.privacyText}>
          Your selfie stays private. It is used only to review your request and
          is never shown to members or hosts.
        </Text>
      </View>

      <View style={styles.checks}>
        <Text style={styles.check}>Real face visible</Text>
        <Text style={styles.check}>Good image quality</Text>
        <Text style={styles.check}>Current, unedited photo</Text>
      </View>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          disabled={!selfie || submitting}
          icon={
            submitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <UploadCloud color={colors.surface} size={20} strokeWidth={2.4} />
            )
          }
          label={submitting ? 'Uploading securely...' : 'Submit for review'}
          onPress={() => void submit()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: spacing.md,
    position: 'absolute',
    top: spacing.md,
    width: 40,
  },
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
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: spacing.md,
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
  libraryButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 40,
  },
  libraryButtonText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  privacyNote: {
    alignItems: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  privacyText: {
    color: colors.secondary,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  selfiePreview: {
    borderRadius: radius.md,
    height: 58,
    width: 58,
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
