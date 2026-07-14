import {
  ArrowLeft,
  HeartHandshake,
  MessageCircleQuestion,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';
import { IcebreakerMember, listIcebreakers } from '../services/community';

type IcebreakersScreenProps = {
  activity: DiscoveryItem;
  idToken: string;
  onBack: () => void;
};

export function IcebreakersScreen({
  activity,
  idToken,
  onBack,
}: IcebreakersScreenProps) {
  const [activityTitle, setActivityTitle] = useState(activity.title);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<IcebreakerMember[]>([]);
  const activityId = activity.remoteId ?? activity.id;
  const type = activity.category === 'circle' ? 'CIRCLE' : 'EVENT';

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const payload = await listIcebreakers(idToken, type, activityId);
        if (!active) {
          return;
        }
        setActivityTitle(payload.activityTitle);
        setMembers(payload.members);
        setError(undefined);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load people for this activity.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [activityId, idToken, type]);

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
        <Text numberOfLines={1} style={styles.topBarTitle}>
          People you&apos;ll meet
        </Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <HeartHandshake
              color={colors.secondary}
              size={24}
              strokeWidth={2.3}
            />
          </View>
          <Text style={styles.title}>{activityTitle}</Text>
          <Text style={styles.subtitle}>
            These are all the interests you and each approved member have in
            common. No full profile or direct messaging is shown here.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>
              Finding your shared interests...
            </Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && !members.length ? (
          <View style={styles.empty}>
            <UsersPlaceholder />
            <Text style={styles.emptyTitle}>No approved members yet</Text>
            <Text style={styles.emptyText}>
              Icebreakers become available when other join requests are
              approved.
            </Text>
          </View>
        ) : null}
        {!loading && !error
          ? members.map((member) => (
              <IcebreakerCard key={member.id} member={member} />
            ))
          : null}
      </ScrollView>
    </View>
  );
}

function IcebreakerCard({ member }: { member: IcebreakerMember }) {
  const name = member.displayName ?? 'Niva member';

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberCopy}>
          <Text style={styles.memberName}>{name}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>All shared interests</Text>
      {member.sharedInterests.length ? (
        <View style={styles.chips}>
          {member.sharedInterests.map((interest) => (
            <View key={interest} style={styles.chip}>
              <Text style={styles.chipText}>{interest}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noOverlap}>
          No shared interests listed yet. Start with the activity itself.
        </Text>
      )}

      <View style={styles.promptHeading}>
        <MessageCircleQuestion
          color={colors.info}
          size={18}
          strokeWidth={2.3}
        />
        <Text style={styles.sectionLabel}>Conversation starters</Text>
      </View>
      <View style={styles.prompts}>
        {member.prompts.map((prompt) => (
          <Text key={prompt} style={styles.prompt}>
            {prompt}
          </Text>
        ))}
      </View>
    </View>
  );
}

function UsersPlaceholder() {
  return (
    <View style={styles.emptyIcon}>
      <HeartHandshake color={colors.muted} size={24} strokeWidth={2.3} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: colors.secondary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  chip: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.xl,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  intro: { alignItems: 'flex-start' },
  introIcon: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  loading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: { color: colors.muted, fontSize: typography.small },
  memberCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  memberCopy: { flex: 1 },
  memberHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  memberName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  noOverlap: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  prompt: { color: colors.ink, fontSize: typography.small, lineHeight: 21 },
  promptHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.lg,
  },
  prompts: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: spacing.md,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: spacing.sm,
  },
  topBarTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
