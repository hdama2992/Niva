import {
  ArrowLeft,
  Ban,
  Bell,
  Eye,
  HeartHandshake,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { BlockedUser, CommunitySettings } from '../services/community';

type SettingsScreenProps = {
  blockedUsers: BlockedUser[];
  onBack: () => void;
  onChange: (settings: CommunitySettings) => void;
  onUnblock: (blockedUserId: string) => void;
  settings: CommunitySettings;
};

export function SettingsScreen({
  blockedUsers,
  onBack,
  onChange,
  onUnblock,
  settings,
}: SettingsScreenProps) {
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
        <Text style={styles.title}>Your preferences</Text>
        <Text style={styles.subtitle}>
          Control what Niva uses to keep your discovery and circle experience
          relevant.
        </Text>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <SettingToggle
          icon={<Bell color={colors.primary} size={20} strokeWidth={2.3} />}
          label="Activity updates"
          onChange={(notificationsEnabled) =>
            onChange({ ...settings, notificationsEnabled })
          }
          text="Receive verification, request, and event update notifications."
          value={settings.notificationsEnabled}
        />

        <Text style={styles.sectionLabel}>Privacy and discovery</Text>
        <SettingToggle
          icon={<Eye color={colors.info} size={20} strokeWidth={2.3} />}
          label="Appear in recommendations"
          onChange={(showProfileInRecommendations) =>
            onChange({ ...settings, showProfileInRecommendations })
          }
          text="Let Niva consider your profile for safe, relevant group suggestions."
          value={settings.showProfileInRecommendations}
        />
        <SettingToggle
          icon={
            <UsersRound color={colors.secondary} size={20} strokeWidth={2.3} />
          }
          label="Circle continuity"
          onChange={(allowCircleContinuitySuggestions) =>
            onChange({ ...settings, allowCircleContinuitySuggestions })
          }
          text="Allow suggestions for another small circle after one finishes."
          value={settings.allowCircleContinuitySuggestions}
        />
        <SettingToggle
          icon={
            <HeartHandshake
              color={colors.secondary}
              size={20}
              strokeWidth={2.3}
            />
          }
          label="Share mutual interests in icebreakers"
          onChange={(showInterestsInIcebreakers) =>
            onChange({ ...settings, showInterestsInIcebreakers })
          }
          text="Approved members can see every interest you share, never your full interests list."
          value={settings.showInterestsInIcebreakers}
        />

        <View style={styles.safetyNote}>
          <ShieldCheck color={colors.secondary} size={21} strokeWidth={2.4} />
          <Text style={styles.safetyText}>
            Your verification selfie stays private. It is not visible to other
            members.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Blocked members</Text>
        {blockedUsers.length ? (
          <View style={styles.blockList}>
            {blockedUsers.map((blockedUser) => (
              <View key={blockedUser.id} style={styles.blockRow}>
                <View style={styles.blockIcon}>
                  <Ban color={colors.warning} size={18} strokeWidth={2.4} />
                </View>
                <View style={styles.blockCopy}>
                  <Text style={styles.blockName}>
                    {blockedUser.blocked.displayName ?? 'Niva member'}
                  </Text>
                  <Text style={styles.blockHandle}>
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
            <Ban color={colors.muted} size={20} strokeWidth={2.3} />
            <Text style={styles.emptyBlocksText}>
              No blocked members. You can block a host from an activity’s
              details.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  blockCopy: {
    flex: 1,
  },
  blockHandle: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 2,
  },
  blockIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  blockList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  blockName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  blockRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  emptyBlocksText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 19,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  safetyNote: {
    alignItems: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  safetyText: {
    color: colors.secondary,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
    textTransform: 'uppercase',
  },
  settingCopy: {
    flex: 1,
  },
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
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  topBarSpacer: {
    height: 44,
    width: 44,
  },
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
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '800',
  },
});
