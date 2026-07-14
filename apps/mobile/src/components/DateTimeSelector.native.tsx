import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarDays, Clock3 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

type PickerMode = 'date' | 'time';

type DateTimeSelectorProps = {
  minimumDate?: Date;
  onChange: (value: Date) => void;
  value: Date;
};

export function DateTimeSelector({
  minimumDate,
  onChange,
  value,
}: DateTimeSelectorProps) {
  const [mode, setMode] = useState<PickerMode>();

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type !== 'set' || !selectedDate || !mode) {
      setMode(undefined);
      return;
    }

    const next = new Date(value);
    if (mode === 'date') {
      next.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );
    } else {
      next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }
    onChange(next);
    setMode(undefined);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Start date and time</Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="Choose start date"
          accessibilityRole="button"
          onPress={() => setMode('date')}
          style={styles.control}
        >
          <CalendarDays color={colors.primary} size={19} strokeWidth={2.3} />
          <View style={styles.copy}>
            <Text style={styles.controlLabel}>Date</Text>
            <Text style={styles.controlValue}>
              {value.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                weekday: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="Choose start time"
          accessibilityRole="button"
          onPress={() => setMode('time')}
          style={styles.control}
        >
          <Clock3 color={colors.secondary} size={19} strokeWidth={2.3} />
          <View style={styles.copy}>
            <Text style={styles.controlLabel}>Time</Text>
            <Text style={styles.controlValue}>
              {value.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.helper}>Choose the date and local start time.</Text>
      {mode ? (
        <DateTimePicker
          display="default"
          is24Hour={false}
          minimumDate={mode === 'date' ? minimumDate : undefined}
          minuteInterval={30}
          mode={mode}
          onChange={handleChange}
          value={value}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  controlLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  controlValue: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
    marginTop: 2,
  },
  controls: { gap: spacing.sm },
  copy: { flex: 1 },
  field: { gap: spacing.xs, marginTop: spacing.xl },
  helper: { color: colors.muted, fontSize: typography.small, lineHeight: 19 },
  label: { color: colors.ink, fontSize: typography.small, fontWeight: '800' },
});
