import {
  ArrowLeft,
  CalendarHeart,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { HostApproval } from '../services/community';
import { NivaUser } from '../types/niva';

type HostPathwayScreenProps = {
  approval: HostApproval | null | undefined;
  onApply: () => void;
  onBack: () => void;
  user: NivaUser;
};

export function HostPathwayScreen({
  approval,
  onApply,
  onBack,
  user,
}: HostPathwayScreenProps) {
  const eligible = ['trusted', 'host_eligible', 'host'].includes(
    user.trustTier,
  );
  const pending = approval?.status === 'PENDING';
  const approved = approval?.status === 'APPROVED';

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.iconButton}
        >
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topBarTitle}>Host with Niva</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <CalendarHeart color={colors.primary} size={30} strokeWidth={2.2} />
          </View>
          <Text style={styles.eyebrow}>BRING PEOPLE TOGETHER</Text>
          <Text style={styles.title}>
            Create plans people feel good joining.
          </Text>
          <Text style={styles.subtitle}>
            Hosts set the tone, welcome members, and keep each gathering
            friendly and well organised.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>What hosting includes</Text>
        <View style={styles.card}>
          <Benefit
            icon={
              <Sparkles color={colors.warning} size={20} strokeWidth={2.3} />
            }
            text="Publish one-time events or recurring circles."
          />
          <Benefit
            icon={
              <UsersRound color={colors.info} size={20} strokeWidth={2.3} />
            }
            text="Review join requests before member details and chat unlock."
          />
          <Benefit
            icon={
              <HeartHandshake
                color={colors.secondary}
                size={20}
                strokeWidth={2.3}
              />
            }
            text="Welcome the group, communicate changes, and help everyone feel included."
          />
        </View>

        <Text style={styles.sectionTitle}>Before you apply</Text>
        <View style={styles.card}>
          <Benefit
            icon={
              <ShieldCheck color={colors.success} size={20} strokeWidth={2.3} />
            }
            text="Your profile must be verified and your participation established."
          />
          <Benefit
            icon={<Clock3 color={colors.info} size={20} strokeWidth={2.3} />}
            text="Niva reviews host applications before publishing tools are enabled."
          />
        </View>

        {approved ? (
          <View style={styles.statusCard}>
            <CheckCircle2 color={colors.success} size={22} strokeWidth={2.5} />
            <View style={styles.flex}>
              <Text style={styles.statusTitle}>You’re approved to host</Text>
              <Text style={styles.statusText}>
                Create an event or circle from your Profile.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {!eligible ? (
              <Text style={styles.eligibilityNote}>
                Host applications unlock after your profile is verified and
                you’ve established positive participation on Niva.
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={!eligible || pending}
              onPress={onApply}
              style={[
                styles.applyButton,
                (!eligible || pending) && styles.applyButtonDisabled,
              ]}
            >
              <Text style={styles.applyButtonText}>
                {pending ? 'Application under review' : 'Apply to host'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}>{icon}</View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 54,
  },
  applyButtonDisabled: { backgroundColor: colors.muted, opacity: 0.55 },
  applyButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '900',
  },
  benefitIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  benefitText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    lineHeight: 23,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eligibilityNote: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
    marginTop: spacing.md,
  },
  flex: { flex: 1 },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.pill,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '900',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  statusText: { color: colors.muted, fontSize: typography.small, marginTop: 2 },
  statusTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.surface,
    fontSize: typography.heading,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: spacing.xs,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  topBarTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '900',
    textAlign: 'center',
  },
});
