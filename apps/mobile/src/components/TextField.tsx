import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

type TextFieldProps = TextInputProps & {
  error?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
  label: string;
};

export function TextField({
  error,
  helperText,
  label,
  style,
  ...props
}: TextFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      <TextInput
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  group: {
    gap: spacing.xs,
    width: '100%',
  },
  helper: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.primaryDark,
  },
  label: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '700',
  },
});
