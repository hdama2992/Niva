import { Heart } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Heart color={colors.primary} fill={colors.primary} size={62} strokeWidth={2.4} />
      </View>
      <Text style={styles.title}>Niva</Text>
      <Text style={styles.subtitle}>Find your people.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 112,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
  },
});
