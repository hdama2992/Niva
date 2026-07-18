import {
  BookOpen,
  Camera,
  Coffee,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';
import { IcebreakerMember, listIcebreakers } from '../services/community';

type IcebreakersScreenProps = {
  activity: DiscoveryItem;
  idToken: string;
  onBack: () => void;
  onOpenChat?: () => void;
  onViewPlan?: () => void;
};

export function IcebreakersScreen({
  activity,
  idToken,
  onBack,
  onOpenChat,
  onViewPlan,
}: IcebreakersScreenProps) {
  const [activityTitle, setActivityTitle] = useState(activity.title);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<IcebreakerMember[]>([]);
  const activityId = activity.remoteId ?? activity.id;
  const type = activity.category === 'circle' ? 'CIRCLE' : 'EVENT';

  useEffect(() => {
    let active = true;
    void listIcebreakers(idToken, type, activityId)
      .then((payload) => {
        if (active) {
          setActivityTitle(payload.activityTitle);
          setMembers(payload.members);
          setError(undefined);
        }
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load people for this activity.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activityId, idToken, type]);

  const interests = useMemo(
    () =>
      Array.from(
        new Set(members.flatMap((member) => member.sharedInterests)),
      ).slice(0, 6),
    [members],
  );
  const prompts = useMemo(
    () =>
      Array.from(new Set(members.flatMap((member) => member.prompts))).slice(
        0,
        3,
      ),
    [members],
  );

  return (
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack} title={`Before ${activityTitle}`} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>
              Finding what your group has in common…
            </Text>
          </View>
        ) : null}
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {!loading && !error && !members.length ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <UsersRound color={colors.muted} size={28} />
            </View>
            <Text style={styles.emptyTitle}>No other approved members yet</Text>
            <Text style={styles.emptyText}>
              This page fills in as the host approves join requests.
            </Text>
          </View>
        ) : null}
        {!loading && members.length ? (
          <>
            <Text style={styles.intro}>
              You already have a few things in common.
            </Text>
            <View style={styles.avatarRow}>
              {members.slice(0, 5).map((member, index) => (
                <MemberAvatar index={index} key={member.id} member={member} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Shared interests</Text>
            <View style={styles.chips}>
              {interests.map((interest) => (
                <InterestChip interest={interest} key={interest} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Conversation starters</Text>
            <View style={styles.promptList}>
              {prompts.map((prompt, index) => (
                <View
                  key={prompt}
                  style={[styles.promptRow, index > 0 && styles.promptDivider]}
                >
                  <View style={styles.promptNumber}>
                    <Text style={styles.promptNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.promptText}>{prompt}</Text>
                </View>
              ))}
            </View>

            <View style={styles.privacyNote}>
              <View style={styles.privacyIcon}>
                <ShieldCheck color={colors.success} size={22} />
              </View>
              <Text style={styles.privacyText}>
                Only interests members choose to share are shown here.
              </Text>
            </View>
            {onOpenChat ? (
              <Pressable
                accessibilityRole="button"
                onPress={onOpenChat}
                style={styles.primaryButton}
              >
                <MessageCircle color={colors.surface} size={21} />
                <Text style={styles.primaryText}>Open group chat</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={onViewPlan ?? onBack}
              style={styles.viewButton}
            >
              <Text style={styles.viewText}>View plan</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function MemberAvatar({
  index,
  member,
}: {
  index: number;
  member: IcebreakerMember;
}) {
  const name = member.displayName ?? 'Niva member';
  return (
    <View
      accessibilityLabel={name}
      style={[styles.avatar, index > 0 && styles.avatarOverlap]}
    >
      {member.profilePhotoUrl ? (
        <Image
          source={{ uri: member.profilePhotoUrl }}
          style={styles.avatarImage}
        />
      ) : (
        <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
      )}
    </View>
  );
}

function InterestChip({ interest }: { interest: string }) {
  const lower = interest.toLowerCase();
  const Icon = lower.includes('book')
    ? BookOpen
    : lower.includes('coffee')
      ? Coffee
      : lower.includes('photo')
        ? Camera
        : UsersRound;
  return (
    <View style={styles.chip}>
      <Icon color={colors.success} size={19} />
      <Text style={styles.chipText}>{interest}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  avatarImage: { height: '100%', width: '100%' },
  avatarOverlap: { marginLeft: -15 },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  avatarText: {
    color: colors.success,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  error: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '700',
  },
  intro: {
    color: colors.muted,
    fontSize: typography.subheading,
    lineHeight: 28,
    textAlign: 'center',
  },
  loading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: { color: colors.muted, fontSize: typography.small },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 56,
  },
  primaryText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '900',
  },
  privacyIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  privacyNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  privacyText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
  },
  promptDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  promptList: { marginTop: spacing.md },
  promptNumber: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  promptNumberText: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '900',
  },
  promptRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 78,
    paddingVertical: spacing.sm,
  },
  promptText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.body,
    lineHeight: 24,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionTitle: {
    color: colors.primaryDark,
    fontSize: typography.heading,
    fontWeight: '900',
    marginTop: spacing.xl,
  },
  viewButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  viewText: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
  },
});
