import { ArrowLeft, Flag } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

export type ReportReason =
  'FAKE_PROFILE' | 'HARASSMENT' | 'INAPPROPRIATE_BEHAVIOUR' | 'OTHER' | 'SPAM';

type ReportScreenProps = {
  onBack: () => void;
  onSubmit: (input: {
    details?: string;
    reason: ReportReason;
  }) => Promise<void>;
  targetName: string;
};

const reasons: Array<{ id: ReportReason; label: string; text: string }> = [
  {
    id: 'SPAM',
    label: 'Spam',
    text: 'Unwanted promotions or repeated content.',
  },
  {
    id: 'FAKE_PROFILE',
    label: 'Fake profile',
    text: 'A misleading or impersonated identity.',
  },
  {
    id: 'HARASSMENT',
    label: 'Harassment',
    text: 'Threatening, pressuring, or unwanted conduct.',
  },
  {
    id: 'INAPPROPRIATE_BEHAVIOUR',
    label: 'Inappropriate behaviour',
    text: 'Conduct that violates community boundaries.',
  },
  {
    id: 'OTHER',
    label: 'Other',
    text: 'Something else the moderation team should review.',
  },
];

export function ReportScreen({
  onBack,
  onSubmit,
  targetName,
}: ReportScreenProps) {
  const [details, setDetails] = useState('');
  const [reason, setReason] = useState<ReportReason>('HARASSMENT');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      await onSubmit({ details: details.trim() || undefined, reason });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit this report. Please try again.',
      );
      setSubmitting(false);
    }
  };

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
        <Text style={styles.topBarTitle}>Report</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Flag color={colors.primary} size={27} strokeWidth={2.3} />
        </View>
        <Text style={styles.title}>Tell us what happened</Text>
        <Text style={styles.subtitle}>
          Your report about {targetName} is private. A moderator will review it.
        </Text>
        <View style={styles.reasonList}>
          {reasons.map((item) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === item.id }}
              key={item.id}
              onPress={() => setReason(item.id)}
              style={[
                styles.reason,
                reason === item.id && styles.reasonSelected,
              ]}
            >
              <View
                style={[
                  styles.radio,
                  reason === item.id && styles.radioSelected,
                ]}
              />
              <View style={styles.reasonCopy}>
                <Text style={styles.reasonLabel}>{item.label}</Text>
                <Text style={styles.reasonText}>{item.text}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Anything else we should know?</Text>
        <TextInput
          maxLength={1000}
          multiline
          onChangeText={setDetails}
          placeholder="Share only details that help a moderator understand the situation."
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={details}
        />
      </ScrollView>
      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void submit()}
          style={[styles.submitButton, submitting && styles.submitDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitText}>Submit report</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLabel: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginTop: spacing.xl,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.sm,
    minHeight: 132,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  radio: {
    borderColor: colors.muted,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 18,
    marginTop: 2,
    width: 18,
  },
  radioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 5,
  },
  reason: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  reasonCopy: { flex: 1 },
  reasonLabel: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  reasonList: { gap: spacing.sm, marginTop: spacing.xl },
  reasonSelected: { borderColor: colors.primary, borderWidth: 2 },
  reasonText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 3,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 54,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
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
