import { ArrowLeft } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

type DeckTopBarProps = {
  onBack: () => void;
  right?: ReactNode;
  title?: string;
};

export function DeckTopBar({ onBack, right, title }: DeckTopBarProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={styles.action}
      >
        <ArrowLeft color={colors.primaryDark} size={28} strokeWidth={2.5} />
      </Pressable>
      {title ? (
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      ) : (
        <View style={styles.center} />
      )}
      <View style={styles.action}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  bar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.sm,
  },
  center: { flex: 1 },
  title: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: typography.subheading,
    fontWeight: '900',
    textAlign: 'center',
  },
});
