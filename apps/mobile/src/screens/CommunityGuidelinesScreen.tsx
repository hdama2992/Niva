import { ArrowLeft, Check, ShieldCheck } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

type CommunityGuidelinesScreenProps = {
  activityTitle: string;
  onAccept: () => void;
  onBack: () => void;
  reviewOnly?: boolean;
};

const guidelines = [
  'Be kind, inclusive, and make space for everyone to feel welcome.',
  'Respect consent and personal boundaries. Never pressure, harass, or share private information.',
  'Show up when you say you will, or cancel early so the host can plan fairly.',
  'Keep chats helpful and community-focused, and report anything that feels unsafe.',
];

export function CommunityGuidelinesScreen({
  activityTitle,
  onAccept,
  onBack,
  reviewOnly = false,
}: CommunityGuidelinesScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onBack}
          style={styles.iconButton}
        >
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.topBarTitle}>{reviewOnly ? 'Community Promise' : 'Before you join'}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <ShieldCheck color={colors.secondary} size={31} strokeWidth={2.3} />
        </View>
        <Text style={styles.title}>
          A friendly plan starts with a shared promise.
        </Text>
        <Text style={styles.subtitle}>
          {reviewOnly
            ? 'These expectations apply in every plan, circle, and conversation on Niva.'
            : `These apply to ${activityTitle} and every Niva space you join.`}
        </Text>

        <View style={styles.guidelines}>
          {guidelines.map((guideline) => (
            <View key={guideline} style={styles.guidelineRow}>
              <View style={styles.checkWrap}>
                <Check color={colors.secondary} size={17} strokeWidth={2.7} />
              </View>
              <Text style={styles.guidelineText}>{guideline}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={onAccept}
          style={styles.acceptButton}
        >
          <Text style={styles.acceptText}>{reviewOnly ? 'Done' : 'I agree and continue'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  acceptButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 54,
  },
  acceptText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  checkWrap: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    marginTop: 1,
    width: 28,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  guidelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  guidelineText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    lineHeight: 24,
  },
  guidelines: {
    gap: spacing.lg,
    marginTop: spacing.xxl,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 35,
    marginTop: spacing.xl,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing.sm,
  },
  topBarTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
