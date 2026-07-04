import { Heart, Server, Smartphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';

type HomeScreenProps = {
  phone: string;
  username: string;
};

export function HomeScreen({ phone, username }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Heart color={colors.primary} fill={colors.primary} size={52} strokeWidth={2.2} />
        <Text style={styles.title}>Welcome to Niva</Text>
        <Text style={styles.subtitle}>Your community will begin here.</Text>
      </View>

      <View style={styles.identityPanel}>
        <Text style={styles.panelLabel}>Signed in as</Text>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.phone}>Verified phone: {phone}</Text>
      </View>

      <View style={styles.flow}>
        <View style={styles.flowItem}>
          <Smartphone color={colors.primaryDark} size={24} strokeWidth={2.2} />
          <View style={styles.flowCopy}>
            <Text style={styles.flowTitle}>React Native Expo</Text>
            <Text style={styles.flowText}>The app users hold.</Text>
          </View>
        </View>
        <View style={styles.connector} />
        <View style={styles.flowItem}>
          <Server color={colors.primaryDark} size={24} strokeWidth={2.2} />
          <View style={styles.flowCopy}>
            <Text style={styles.flowTitle}>NestJS Backend</Text>
            <Text style={styles.flowText}>Business rules, Firebase token checks, PostgreSQL.</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  connector: {
    backgroundColor: colors.border,
    height: 24,
    marginLeft: 29,
    width: 2,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  flow: {
    marginTop: spacing.lg,
  },
  flowCopy: {
    flex: 1,
    gap: 3,
  },
  flowItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 78,
    padding: spacing.md,
  },
  flowText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  flowTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  identityPanel: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  panelLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  phone: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  username: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
