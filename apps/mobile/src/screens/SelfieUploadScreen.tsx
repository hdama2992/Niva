import {
  Camera,
  Check,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';
import { SelectedImage, takeSelfie } from '../services/media';

type SelfieUploadScreenProps = {
  displayName: string;
  joiningTitle?: string;
  onBack: () => void;
  onSubmit: (image: SelectedImage) => Promise<void> | void;
};

const checks = [
  { Icon: UserRound, text: 'Face the camera directly' },
  { Icon: Sun, text: 'Use bright, even light' },
  { Icon: Check, text: 'Remove sunglasses, masks and hats' },
  { Icon: X, text: 'No filters or edited photos' },
];

export function SelfieUploadScreen({
  displayName,
  joiningTitle,
  onBack,
  onSubmit,
}: SelfieUploadScreenProps) {
  const [selfie, setSelfie] = useState<SelectedImage>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const openCamera = async () => {
    try {
      const selected = await takeSelfie();
      if (selected) setSelfie(selected);
      setError(undefined);
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : 'Unable to open the camera.',
      );
    }
  };

  const submit = async () => {
    if (!selfie) return;
    setSubmitting(true);
    setError(undefined);
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
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Private verification</Text>
        <Text style={styles.title}>Take a verification selfie</Text>
        <View style={styles.privateCard}>
          <ShieldCheck color={colors.success} size={26} />
          <Text style={styles.privateText}>
            <Text style={styles.privateStrong}>
              Only Niva’s review team sees this selfie.
            </Text>
            {'\n'}It never appears on your profile.
          </Text>
        </View>

        <Pressable
          accessibilityLabel="Open camera for verification selfie"
          accessibilityRole="button"
          onPress={() => void openCamera()}
          style={styles.guideFrame}
        >
          <Image
            resizeMode="cover"
            source={
              selfie
                ? { uri: selfie.uri }
                : require('../../assets/verification-selfie-guide.webp')
            }
            style={styles.guideImage}
          />
          <View style={styles.faceGuide} />
          <View style={styles.faceStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.faceStatusText}>
              {selfie ? 'Selfie ready' : 'Face centred'}
            </Text>
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>Before you take it</Text>
        <View style={styles.checkList}>
          {checks.map(({ Icon, text }, index) => (
            <View
              key={text}
              style={[styles.checkRow, index > 0 && styles.checkDivider]}
            >
              <Icon color={colors.success} size={23} strokeWidth={2.1} />
              <Text style={styles.checkText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.identityNote}>
          <ShieldCheck color={colors.success} size={25} />
          <Text style={styles.identityText}>
            We use this only to review your identity and protect the community.
          </Text>
        </View>
        {joiningTitle ? (
          <Text style={styles.joiningText}>
            Verification is required before requesting to join {joiningTitle}.
          </Text>
        ) : null}
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}

        {selfie ? (
          <View style={styles.actions}>
            <PrimaryButton
              disabled={submitting}
              icon={
                submitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <ShieldCheck color={colors.surface} size={20} />
                )
              }
              label={submitting ? 'Submitting securely…' : 'Submit for review'}
              onPress={() => void submit()}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => void openCamera()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Retake selfie</Text>
            </Pressable>
          </View>
        ) : (
          <PrimaryButton
            icon={<Camera color={colors.surface} size={21} />}
            label={`Open camera${displayName ? `, ${displayName}` : ''}`}
            onPress={() => void openCamera()}
          />
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => setWhyOpen(true)}
          style={styles.whyButton}
        >
          <Text style={styles.whyText}>Why verification is required</Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setWhyOpen(false)}
        visible={whyOpen}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Why verification is required</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={() => setWhyOpen(false)}
            >
              <X color={colors.ink} size={25} />
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <ShieldCheck color={colors.success} size={42} />
            <Text style={styles.modalHeading}>A private identity check</Text>
            <Text style={styles.modalText}>
              The selfie helps an authorised reviewer confirm that the person
              joining plans matches the account. Hosts and members never receive
              it. It is stored privately and removed when the account is
              deleted.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  checkDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  checkList: { marginBottom: spacing.md },
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 50,
  },
  checkText: { color: colors.primary, flex: 1, fontSize: typography.small },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  error: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  faceGuide: {
    borderColor: 'rgba(206,231,192,0.92)',
    borderRadius: radius.pill,
    borderWidth: 2,
    height: '66%',
    left: '21%',
    position: 'absolute',
    top: '10%',
    width: '58%',
  },
  faceStatus: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(16,20,22,0.74)',
    borderRadius: radius.md,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
  },
  faceStatusText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  guideFrame: {
    borderRadius: radius.lg,
    height: 330,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  guideImage: { height: '100%', width: '100%' },
  identityNote: {
    alignItems: 'flex-start',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  identityText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
  },
  joiningText: {
    color: colors.muted,
    fontSize: typography.small,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  modalContent: { padding: spacing.lg },
  modalHeading: {
    color: colors.primaryDark,
    fontSize: typography.heading,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.lg,
  },
  modalScreen: { backgroundColor: colors.background, flex: 1 },
  modalText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 25,
    marginTop: spacing.md,
  },
  modalTitle: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  privateCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.successSoft,
    borderColor: '#C9DCCF',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  privateStrong: { color: '#386749', fontWeight: '900' },
  privateText: {
    color: '#386749',
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  statusDot: {
    backgroundColor: '#75B77A',
    borderRadius: radius.pill,
    height: 10,
    width: 10,
  },
  title: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    marginTop: spacing.sm,
  },
  whyButton: { alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  whyText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
