import { ChevronRight, ShieldAlert, ShieldCheck } from 'lucide-react-native';
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

import { DeckTopBar } from '../components/DeckTopBar';
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

const reasons: Array<{ id: ReportReason; label: string }> = [
  { id: 'INAPPROPRIATE_BEHAVIOUR', label: 'Unsafe or threatening behaviour' },
  { id: 'HARASSMENT', label: 'Harassment or unwanted contact' },
  { id: 'FAKE_PROFILE', label: 'Misleading identity or profile' },
  { id: 'SPAM', label: 'Problem with a plan or host' },
  { id: 'OTHER', label: 'Something else' },
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
      <DeckTopBar onBack={onBack} title="Report a concern" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.privateCard}>
          <ShieldCheck color={colors.success} size={35} />
          <View style={styles.privateCopy}>
            <Text style={styles.privateTitle}>Your report is private.</Text>
            <Text style={styles.privateText}>
              {targetName} won’t be told who submitted it.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>What happened?</Text>
        <View style={styles.reasonList}>
          {reasons.map((item, index) => {
            const selected = reason === item.id;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={item.id}
                onPress={() => setReason(item.id)}
                style={[
                  styles.reasonRow,
                  index > 0 && styles.reasonDivider,
                  selected && styles.reasonSelected,
                ]}
              >
                <View
                  style={[styles.radio, selected && styles.radioSelected]}
                />
                <Text style={styles.reasonLabel}>{item.label}</Text>
                <ChevronRight color={colors.muted} size={21} />
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>
          Add details that help us understand{' '}
          <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.inputWrap}>
          <TextInput
            accessibilityLabel="Report details"
            maxLength={500}
            multiline
            onChangeText={setDetails}
            placeholder="Share what happened. Avoid including sensitive information that isn’t needed."
            placeholderTextColor={colors.muted}
            style={styles.input}
            textAlignVertical="top"
            value={details}
          />
          <Text style={styles.counter}>{details.length}/500</Text>
        </View>

        <View style={styles.dangerCard}>
          <ShieldAlert color={colors.warning} size={30} />
          <Text style={styles.dangerText}>
            If you’re in immediate danger, contact local emergency services.
          </Text>
        </View>
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void submit()}
          style={[styles.submitButton, submitting && styles.disabled]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitText}>Submit report</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  counter: {
    bottom: spacing.sm,
    color: colors.muted,
    fontSize: typography.small,
    position: 'absolute',
    right: spacing.md,
  },
  dangerCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderColor: '#EFCFC2',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  dangerText: {
    color: colors.warning,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 20,
  },
  disabled: { opacity: 0.6 },
  error: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  fieldLabel: {
    color: colors.primaryDark,
    fontSize: typography.subheading,
    fontWeight: '900',
    marginTop: spacing.xl,
  },
  input: {
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 23,
    minHeight: 132,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    position: 'relative',
  },
  optional: { color: colors.muted, fontWeight: '500' },
  privateCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.successSoft,
    borderColor: '#C9DCCF',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  privateCopy: { flex: 1 },
  privateText: {
    color: '#386749',
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: 4,
  },
  privateTitle: {
    color: '#386749',
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  radio: {
    borderColor: colors.muted,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 22,
    width: 22,
  },
  radioSelected: { borderColor: colors.primary, borderWidth: 7 },
  reasonDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  reasonLabel: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
  },
  reasonList: { marginTop: spacing.md },
  reasonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.sm,
  },
  reasonSelected: { backgroundColor: colors.infoSoft },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.heading,
    fontWeight: '900',
    marginTop: spacing.xl,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 56,
  },
  submitText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '900',
  },
});
