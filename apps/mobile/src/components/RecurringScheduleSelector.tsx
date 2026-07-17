import { Repeat2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

export type RecurringCadence = 'FORTNIGHTLY' | 'WEEKLY';

const options: Array<{ id: RecurringCadence; label: string }> = [
  { id: 'WEEKLY', label: 'Every week' },
  { id: 'FORTNIGHTLY', label: 'Every 2 weeks' },
];

export function RecurringScheduleSelector({
  cadence,
  onChange,
  startsAt,
}: {
  cadence: RecurringCadence;
  onChange: (cadence: RecurringCadence) => void;
  startsAt: Date;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>Repeats</Text>
      <View style={styles.segmentedControl}>
        {options.map((option) => {
          const selected = cadence === option.id;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.preview}>
        <Repeat2 color={colors.secondary} size={19} strokeWidth={2.4} />
        <Text style={styles.previewText}>
          {formatRecurringSchedule(startsAt, cadence)}
        </Text>
      </View>
    </View>
  );
}

export function formatRecurringSchedule(
  startsAt: Date,
  cadence: RecurringCadence,
) {
  const dayAndTime = startsAt.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    weekday: 'long',
  });

  return cadence === 'WEEKLY'
    ? `Every ${dayAndTime}`
    : `Every other ${dayAndTime}`;
}

export function cadenceFromSchedule(schedule?: string): RecurringCadence {
  return schedule?.toLowerCase().includes('other') ||
    schedule?.toLowerCase().includes('2 week')
    ? 'FORTNIGHTLY'
    : 'WEEKLY';
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  label: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '700',
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  optionSelected: {
    backgroundColor: colors.surface,
  },
  optionText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  optionTextSelected: {
    color: colors.ink,
  },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  previewText: {
    color: colors.secondary,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
  },
  segmentedControl: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
});
