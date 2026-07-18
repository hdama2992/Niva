import {
  CalendarCheck2,
  Check,
  Handshake,
  ShieldAlert,
  UserRoundCheck,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
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

type SelfDeclarationScreenProps = {
  displayName: string;
  onAccept: () => void;
  onBack?: () => void;
};

const promises = [
  { Icon: Handshake, text: 'Be respectful in person and in chat' },
  { Icon: UserRoundCheck, text: 'Respect boundaries and privacy' },
  { Icon: CalendarCheck2, text: 'Show up or cancel early' },
  { Icon: ShieldAlert, text: 'Report behaviour that makes someone unsafe' },
];

export function SelfDeclarationScreen({
  displayName,
  onAccept,
  onBack,
}: SelfDeclarationScreenProps) {
  const [accepted, setAccepted] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  return (
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack ?? (() => undefined)} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>COMMUNITY PROMISE</Text>
        <Text style={styles.title}>One promise before you join</Text>
        <Text style={styles.subtitle}>
          {displayName}, Niva works when everyone helps gatherings feel safe,
          friendly and respectful.
        </Text>

        <View style={styles.promiseCard}>
          {promises.map(({ Icon, text }, index) => (
            <View
              key={text}
              style={[styles.promiseRow, index > 0 && styles.promiseDivider]}
            >
              <View style={styles.promiseIcon}>
                <Icon color={colors.success} size={25} strokeWidth={2.2} />
              </View>
              <Text style={styles.promiseText}>{text}</Text>
            </View>
          ))}
        </View>

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
            I agree to follow Niva’s{' '}
            <Text style={styles.agreementStrong}>Community Promise.</Text>
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setGuidelinesOpen(true)}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Read the full guidelines</Text>
        </Pressable>

        <View style={styles.warningRow}>
          <ShieldAlert color={colors.warning} size={23} />
          <Text style={styles.warningText}>
            Breaking these rules may lead to restricted or removed access.
          </Text>
        </View>

        <PrimaryButton
          disabled={!accepted}
          label="Agree and continue"
          onPress={onAccept}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setGuidelinesOpen(false)}
        visible={guidelinesOpen}
      >
        <View style={styles.guidelinesScreen}>
          <View style={styles.guidelinesHeader}>
            <Text style={styles.guidelinesTitle}>Community guidelines</Text>
            <Pressable
              accessibilityLabel="Close guidelines"
              accessibilityRole="button"
              onPress={() => setGuidelinesOpen(false)}
              style={styles.closeButton}
            >
              <X color={colors.ink} size={24} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.guidelinesContent}>
            <Text style={styles.guidelinesLead}>
              Niva is built for respectful, low-pressure, real-world connection.
            </Text>
            {promises.map(({ text }, index) => (
              <View key={text} style={styles.guidelineItem}>
                <Text style={styles.guidelineNumber}>{index + 1}</Text>
                <View style={styles.guidelineCopy}>
                  <Text style={styles.guidelineHeading}>{text}</Text>
                  <Text style={styles.guidelineBody}>
                    {guidelineDetail(index)}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.guidelineSafety}>
              <ShieldAlert color={colors.warning} size={24} />
              <Text style={styles.guidelineSafetyText}>
                If somebody is in immediate danger, contact local emergency
                services before reporting inside Niva.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function guidelineDetail(index: number) {
  return [
    'Use considerate language, do not harass members, and keep cohort chats relevant to the plan.',
    'Do not share another member’s phone number, photos, location, or messages without permission.',
    'Respect the host’s time. If plans change, cancel as early as possible so another member can join.',
    'Use private reporting when behaviour feels unsafe, discriminatory, deceptive, or persistently unwelcome.',
  ][index];
}

const styles = StyleSheet.create({
  agreementRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  agreementStrong: { fontWeight: '900' },
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
  closeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: spacing.lg,
  },
  guidelineBody: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: 4,
  },
  guidelineCopy: { flex: 1 },
  guidelineHeading: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  guidelineItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  guidelineNumber: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  guidelineSafety: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  guidelineSafetyText: {
    color: colors.warning,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
  },
  guidelinesContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  guidelinesHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.md,
  },
  guidelinesLead: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
  },
  guidelinesScreen: { backgroundColor: colors.background, flex: 1 },
  guidelinesTitle: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  linkButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    color: '#1769B0',
    fontSize: typography.body,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  promiseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  promiseDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  promiseIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  promiseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 88,
  },
  promiseText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 25,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.primaryDark,
    fontSize: typography.title,
    fontWeight: '900',
    lineHeight: 44,
    marginTop: spacing.md,
  },
  warningRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  warningText: {
    color: colors.warning,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
  },
});
