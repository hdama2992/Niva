import {
  ArrowLeft,
  Ban,
  Bell,
  ChevronRight,
  CircleHelp,
  Eye,
  FileText,
  LogOut,
  Pencil,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { PRIVACY_POLICY_URL, SUPPORT_URL, TERMS_URL } from '../constants/legal';
import { BlockedUser, CommunitySettings } from '../services/community';
import { NivaUser } from '../types/niva';

type SettingsScreenProps = {
  blockedUsers: BlockedUser[];
  onBack: () => void;
  onChange: (settings: CommunitySettings) => void;
  onDeleteAccount: () => Promise<void>;
  onEditProfile: () => void;
  onLogout: () => void;
  onStartVerification: () => void;
  onUnblock: (blockedUserId: string) => void;
  settings: CommunitySettings;
  verificationStatus: NivaUser['verificationStatus'];
};

export function SettingsScreen({
  blockedUsers,
  onBack,
  onChange,
  onDeleteAccount,
  onEditProfile,
  onLogout,
  onStartVerification,
  onUnblock,
  settings,
  verificationStatus,
}: SettingsScreenProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await onDeleteAccount();
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to delete this account.',
      );
      setDeleting(false);
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
        <Text style={styles.topBarTitle}>Settings</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Your profile, safety, and account.</Text>

        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.groupNoMargin}>
          <NavigationRow
            icon={<Pencil color={colors.primary} size={20} strokeWidth={2.3} />}
            label="Edit profile"
            onPress={onEditProfile}
          />
        </View>

        <Text style={styles.sectionLabel}>Verification & safety</Text>
        <View style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <View style={styles.verificationIcon}>
              <ShieldCheck
                color={colors.secondary}
                size={22}
                strokeWidth={2.4}
              />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>
                {verificationStatus === 'approved'
                  ? 'Verification completed'
                  : verificationStatus === 'pending'
                    ? 'Verification in review'
                    : 'Complete verification'}
              </Text>
              <Text style={styles.settingText}>
                {verificationStatus === 'approved'
                  ? 'Your profile has been verified.'
                  : verificationStatus === 'pending'
                    ? 'We’ll update this status after review.'
                    : 'Verify your profile when you are ready to join plans.'}
              </Text>
            </View>
          </View>
          {verificationStatus !== 'approved' &&
          verificationStatus !== 'pending' ? (
            <Pressable
              accessibilityRole="button"
              onPress={onStartVerification}
              style={styles.verificationButton}
            >
              <Text style={styles.verificationButtonText}>
                Start verification
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.group}>
          <SettingToggle
            icon={<Bell color={colors.primary} size={20} strokeWidth={2.3} />}
            label="Push notifications"
            onChange={(notificationsEnabled) =>
              onChange({ ...settings, notificationsEnabled })
            }
            text="Plan changes, join updates, and safety notices."
            value={settings.notificationsEnabled}
          />
          <SettingToggle
            icon={<Eye color={colors.info} size={20} strokeWidth={2.3} />}
            label="Appear in recommendations"
            onChange={(showProfileInRecommendations) =>
              onChange({ ...settings, showProfileInRecommendations })
            }
            text="Allow your profile to appear in relevant plan suggestions."
            value={settings.showProfileInRecommendations}
          />
        </View>
        <Text style={styles.sectionLabel}>Blocked members</Text>
        {blockedUsers.length ? (
          <View style={styles.groupNoMargin}>
            {blockedUsers.map((blockedUser) => (
              <View key={blockedUser.id} style={styles.blockRow}>
                <View style={styles.settingIcon}>
                  <Ban color={colors.warning} size={18} strokeWidth={2.4} />
                </View>
                <View style={styles.settingCopy}>
                  <Text style={styles.settingLabel}>
                    {blockedUser.blocked.displayName ?? 'Niva member'}
                  </Text>
                  <Text style={styles.settingText}>
                    @{blockedUser.blocked.username ?? 'member'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onUnblock(blockedUser.blockedId)}
                  style={styles.unblockButton}
                >
                  <Text style={styles.unblockText}>Unblock</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyBlocks}>
            <ShieldCheck color={colors.success} size={20} strokeWidth={2.3} />
            <Text style={styles.emptyBlocksText}>
              You have no blocked members.
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Help & legal</Text>
        <View style={styles.groupNoMargin}>
          <ExternalRow
            icon={
              <CircleHelp color={colors.primary} size={20} strokeWidth={2.3} />
            }
            label="Contact support"
            onPress={() => void openRequiredUrl(SUPPORT_URL, 'Support')}
          />
          <ExternalRow
            icon={
              <FileText color={colors.secondary} size={20} strokeWidth={2.3} />
            }
            label="Privacy Policy"
            onPress={() =>
              void openRequiredUrl(PRIVACY_POLICY_URL, 'Privacy Policy')
            }
          />
          <ExternalRow
            icon={<FileText color={colors.info} size={20} strokeWidth={2.3} />}
            label="Terms of Service"
            onPress={() => void openRequiredUrl(TERMS_URL, 'Terms of Service')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onLogout}
          style={styles.logoutButton}
        >
          <LogOut color={colors.primary} size={19} strokeWidth={2.4} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setDeleteOpen(true)}
          style={styles.deleteButton}
        >
          <Trash2 color={colors.warning} size={19} strokeWidth={2.4} />
          <Text style={styles.deleteTitle}>Delete account</Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => !deleting && setDeleteOpen(false)}
        transparent
        visible={deleteOpen}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteModalIcon}>
              <Trash2 color={colors.warning} size={24} strokeWidth={2.4} />
            </View>
            <Text style={styles.deleteModalTitle}>
              Delete your Niva account?
            </Text>
            <Text style={styles.deleteModalText}>
              This cannot be undone. Your profile, memberships, messages, and
              uploaded photos will be removed.
            </Text>
            {deleteError ? (
              <Text style={styles.deleteError}>{deleteError}</Text>
            ) : null}
            <View style={styles.deleteActions}>
              <Pressable
                disabled={deleting}
                onPress={() => setDeleteOpen(false)}
                style={styles.cancelDeleteButton}
              >
                <Text style={styles.cancelDeleteText}>Keep account</Text>
              </Pressable>
              <Pressable
                disabled={deleting}
                onPress={() => void confirmDelete()}
                style={styles.confirmDeleteButton}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.confirmDeleteText}>
                    Delete permanently
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

async function openRequiredUrl(url: string | undefined, label: string) {
  if (!url) {
    Alert.alert(
      `${label} unavailable`,
      'This link has not been configured for this development build.',
    );
    return;
  }
  await Linking.openURL(url);
}

function ExternalRow({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={styles.externalRow}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <Text style={styles.externalLabel}>{label}</Text>
      <ChevronRight color={colors.muted} size={20} strokeWidth={2.4} />
    </Pressable>
  );
}

function NavigationRow({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.externalRow}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <Text style={styles.externalLabel}>{label}</Text>
      <ChevronRight color={colors.muted} size={20} strokeWidth={2.4} />
    </Pressable>
  );
}

function SettingToggle({
  icon,
  label,
  onChange,
  text,
  value,
}: {
  icon: ReactNode;
  label: string;
  onChange: (value: boolean) => void;
  text: string;
  value: boolean;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingText}>{text}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        onValueChange={onChange}
        thumbColor={colors.surface}
        trackColor={{ false: colors.border, true: colors.secondary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blockRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  cancelDeleteButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelDeleteText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  confirmDeleteButton: {
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: radius.md,
    flex: 1.2,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  confirmDeleteText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  content: { padding: spacing.lg, paddingBottom: 120 },
  deleteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  deleteError: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  deleteModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    maxWidth: 460,
    padding: spacing.lg,
    width: '90%',
  },
  deleteModalIcon: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 48,
  },
  deleteModalText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  deleteModalTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  deleteTitle: {
    color: colors.warning,
    fontSize: typography.body,
    fontWeight: '800',
  },
  emptyBlocks: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  emptyBlocksText: { color: colors.muted, flex: 1, fontSize: typography.small },
  externalLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '800',
  },
  externalRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
  },
  group: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  groupNoMargin: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(20,35,52,0.42)',
    flex: 1,
    justifyContent: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  logoutText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
    textTransform: 'uppercase',
  },
  settingCopy: { flex: 1 },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  settingLabel: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  settingText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 62,
    paddingHorizontal: spacing.md,
  },
  topBarSpacer: { height: 44, width: 44 },
  topBarTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  unblockButton: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  unblockText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  verificationButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 48,
  },
  verificationButtonText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  verificationCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  verificationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  verificationIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
