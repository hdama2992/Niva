import { Clock3, Compass, ShieldAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../constants/theme';

type VerificationPendingScreenProps = {
  displayName: string;
  onContinue: () => void;
};

export function VerificationPendingScreen({
  displayName,
  onContinue,
}: VerificationPendingScreenProps) {
  return (
    <View style={styles.container}>
      <View>
        <View style={styles.iconPlate}>
          <Clock3 color={colors.warning} size={36} strokeWidth={2.2} />
        </View>
        <Text style={styles.eyebrow}>Review pending</Text>
        <Text style={styles.title}>Thanks, {displayName}</Text>
        <Text style={styles.subtitle}>
          Your selfie is under review. You can keep browsing while join
          requests stay locked.
        </Text>
      </View>

      <View style={styles.statusBox}>
        <View style={styles.statusRow}>
          <ShieldAlert color={colors.warning} size={22} strokeWidth={2.3} />
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Basic verification pending</Text>
            <Text style={styles.statusText}>
              Joining events, circles, and chat opens after approval.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          icon={<Compass color={colors.surface} size={20} strokeWidth={2.4} />}
          label="Browse nearby"
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  footer: {
    marginTop: spacing.xl,
  },
  iconPlate: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    height: 70,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 70,
  },
  statusBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  statusTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
});
