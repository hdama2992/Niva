import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

type DateTimeSelectorProps = {
  minimumDate?: Date;
  onChange: (value: Date) => void;
  value: Date;
};

// The native picker is not available in Expo web. Keep the same deliberate,
// typed-date-free interaction for browser previews.
export function DateTimeSelector({
  minimumDate,
  onChange,
  value,
}: DateTimeSelectorProps) {
  const adjust = (days: number, minutes: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    next.setMinutes(next.getMinutes() + minutes);

    if (minimumDate && next.getTime() < minimumDate.getTime()) {
      return;
    }

    onChange(next);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Start date and time</Text>
      <View style={styles.scheduleControl}>
        <View style={styles.scheduleRow}>
          <CalendarDays color={colors.primary} size={19} strokeWidth={2.3} />
          <Text style={styles.scheduleValue}>
            {value.toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              weekday: 'short',
              year: 'numeric',
            })}
          </Text>
          <Pressable
            accessibilityLabel="Previous day"
            accessibilityRole="button"
            onPress={() => adjust(-1, 0)}
            style={styles.button}
          >
            <ChevronLeft color={colors.ink} size={20} strokeWidth={2.5} />
          </Pressable>
          <Pressable
            accessibilityLabel="Next day"
            accessibilityRole="button"
            onPress={() => adjust(1, 0)}
            style={styles.button}
          >
            <ChevronRight color={colors.ink} size={20} strokeWidth={2.5} />
          </Pressable>
        </View>
        <View style={styles.scheduleRow}>
          <Clock3 color={colors.secondary} size={19} strokeWidth={2.3} />
          <Text style={styles.scheduleValue}>
            {value.toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
          <Pressable
            accessibilityLabel="Earlier time"
            accessibilityRole="button"
            onPress={() => adjust(0, -30)}
            style={styles.button}
          >
            <ChevronLeft color={colors.ink} size={20} strokeWidth={2.5} />
          </Pressable>
          <Pressable
            accessibilityLabel="Later time"
            accessibilityRole="button"
            onPress={() => adjust(0, 30)}
            style={styles.button}
          >
            <ChevronRight color={colors.ink} size={20} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.helper}>
        Choose the day and local time in 30-minute steps.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 32,
  },
  field: { gap: spacing.xs, marginTop: spacing.xl },
  helper: { color: colors.muted, fontSize: typography.small, lineHeight: 19 },
  label: { color: colors.ink, fontSize: typography.small, fontWeight: '800' },
  scheduleControl: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.xs,
  },
  scheduleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  scheduleValue: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
  },
});
