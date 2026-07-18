import {
  Check,
  Clock3,
  Compass,
  Headphones,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react-native';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';

type VerificationPendingScreenProps = {
  displayName: string;
  onBack?: () => void;
  onContinue: () => void;
};

export function VerificationPendingScreen({
  displayName,
  onBack,
  onContinue,
}: VerificationPendingScreenProps) {
  return (
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack ?? onContinue} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Private verification</Text>
        <Text style={styles.title}>Verification in review</Text>
        <Text style={styles.subtitle}>
          Thanks, {displayName}. We’ll let you know once the review is complete.
        </Text>

        <View style={styles.receivedCard}>
          <View style={styles.receivedIcon}>
            <ShieldCheck color={colors.success} size={40} />
            <View style={styles.checkBadge}>
              <Check color={colors.surface} size={16} strokeWidth={3} />
            </View>
          </View>
          <View style={styles.receivedCopy}>
            <Text style={styles.receivedTitle}>Selfie received</Text>
            <Text style={styles.receivedText}>
              Niva’s review team is checking that your selfie matches your
              profile. Your selfie stays private.
            </Text>
          </View>
        </View>

        <View style={styles.timeline}>
          <TimelineStep
            state="done"
            title="Submitted"
            text="Your verification selfie was uploaded securely"
          />
          <TimelineStep
            state="active"
            title="Review in progress"
            text="Our team is reviewing your selfie"
          />
          <TimelineStep
            state="pending"
            title="Decision"
            text="We’ll notify you once the review is complete"
          />
        </View>

        <View style={styles.timeNote}>
          <View style={styles.timeIcon}>
            <Clock3 color={colors.success} size={20} />
          </View>
          <Text style={styles.timeText}>
            Most reviews are completed within 24 hours.
          </Text>
        </View>

        <View style={styles.waitCard}>
          <Text style={styles.waitTitle}>While you wait</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={styles.waitRow}
          >
            <View style={styles.waitIcon}>
              <Compass color={colors.success} size={21} />
            </View>
            <View style={styles.waitCopy}>
              <Text style={styles.waitRowTitle}>
                You can continue browsing plans
              </Text>
              <Text style={styles.waitRowText}>
                Explore and shortlist plans you like.
              </Text>
            </View>
          </Pressable>
          <View style={[styles.waitRow, styles.waitDivider]}>
            <View style={styles.waitIcon}>
              <LockKeyhole color={colors.success} size={21} />
            </View>
            <View style={styles.waitCopy}>
              <Text style={styles.waitRowTitle}>
                Joining unlocks after approval
              </Text>
              <Text style={styles.waitRowText}>
                Once approved, you’ll be able to join and connect.
              </Text>
            </View>
          </View>
        </View>

        <PrimaryButton label="Continue to Niva" onPress={onContinue} />
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void Linking.openURL(
              'mailto:care@niva.community?subject=Verification help',
            )
          }
          style={styles.helpButton}
        >
          <Headphones color={colors.primary} size={21} />
          <Text style={styles.helpText}>Get help</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function TimelineStep({
  state,
  text,
  title,
}: {
  state: 'active' | 'done' | 'pending';
  text: string;
  title: string;
}) {
  return (
    <View style={styles.timelineRow}>
      <View
        style={[
          styles.timelineDot,
          state === 'done' && styles.timelineDone,
          state === 'active' && styles.timelineActive,
        ]}
      >
        {state === 'done' ? (
          <Check color={colors.surface} size={16} strokeWidth={3} />
        ) : null}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkBadge: {
    alignItems: 'center',
    backgroundColor: '#5DAA73',
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    bottom: -4,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    width: 28,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  helpButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 54,
  },
  helpText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '900',
  },
  receivedCard: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: '#CFDDD4',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  receivedCopy: { flex: 1 },
  receivedIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.pill,
    height: 76,
    justifyContent: 'center',
    position: 'relative',
    width: 76,
  },
  receivedText: {
    color: colors.ink,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: 5,
  },
  receivedTitle: {
    color: '#386749',
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 25,
    marginTop: spacing.sm,
  },
  timeIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  timeNote: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
  },
  timeText: { color: colors.ink, flex: 1, fontSize: typography.small },
  timeline: { marginTop: spacing.xl, paddingHorizontal: spacing.md },
  timelineActive: {
    backgroundColor: colors.primary,
    borderColor: '#BDD3E9',
    borderWidth: 6,
  },
  timelineCopy: { flex: 1, paddingBottom: spacing.lg },
  timelineDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  timelineDot: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: '#95A0AD',
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  timelineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: 3,
  },
  timelineTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
  },
  title: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    marginTop: spacing.sm,
  },
  waitCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  waitCopy: { flex: 1 },
  waitDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  waitIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  waitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 84,
  },
  waitRowText: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 4,
  },
  waitRowTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '800',
  },
  waitTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '900',
    paddingTop: spacing.lg,
  },
});
