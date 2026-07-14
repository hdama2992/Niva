import {
  ArrowLeft,
  Check,
  CircleAlert,
  Star,
  UsersRound,
  X,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';
import {
  EventMember,
  EventFeedbackInsights,
  getEventFeedbackInsights,
  listEventMembers,
  updateEventAttendance,
  updateEventMembership,
} from '../services/community';

type ManageEventScreenProps = {
  event: DiscoveryItem;
  idToken: string;
  onBack: () => void;
};

export function ManageEventScreen({
  event,
  idToken,
  onBack,
}: ManageEventScreenProps) {
  const [error, setError] = useState<string>();
  const [members, setMembers] = useState<EventMember[]>([]);
  const [insights, setInsights] = useState<EventFeedbackInsights>();
  const [updatingMemberId, setUpdatingMemberId] = useState<string>();
  const eventId = event.remoteId ?? event.id;

  const load = async () => {
    try {
      const [membersPayload, insightsPayload] = await Promise.all([
        listEventMembers(idToken, eventId),
        getEventFeedbackInsights(idToken, eventId),
      ]);
      setMembers(membersPayload.members);
      setInsights(insightsPayload.insights);
      setError(undefined);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load members.',
      );
    }
  };

  useEffect(() => {
    void load();
  }, [eventId, idToken]);

  const update = async (
    member: EventMember,
    status: 'APPROVED' | 'ATTENDED' | 'CANCELLED' | 'NO_SHOW',
  ) => {
    try {
      setUpdatingMemberId(member.id);
      if (status === 'APPROVED' || status === 'CANCELLED') {
        await updateEventMembership(idToken, eventId, member.id, status);
      } else {
        await updateEventAttendance(idToken, eventId, member.id, status);
      }
      await load();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update this member.',
      );
    } finally {
      setUpdatingMemberId(undefined);
    }
  };

  const pending = members.filter((member) => member.status === 'REQUESTED');
  const confirmed = members.filter((member) => member.status === 'APPROVED');
  const finished = members.filter(
    (member) => member.status === 'ATTENDED' || member.status === 'NO_SHOW',
  );

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
          Manage event
        </Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.subtitle}>
          Approve requests before the cohort chat opens. Mark attendance after
          the event.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {insights ? <FeedbackInsights insights={insights} /> : null}
        <MemberSection
          title="Join requests"
          members={pending}
          empty="No requests waiting for review."
          renderActions={(member) => (
            <View style={styles.actions}>
              <SmallAction
                busy={updatingMemberId === member.id}
                label="Approve"
                onPress={() => void update(member, 'APPROVED')}
                tone="approve"
              />
              <SmallAction
                busy={updatingMemberId === member.id}
                label="Decline"
                onPress={() => void update(member, 'CANCELLED')}
                tone="decline"
              />
            </View>
          )}
        />
        <MemberSection
          title="Confirmed members"
          members={confirmed}
          empty="No approved members yet."
          renderActions={(member) => (
            <View style={styles.actions}>
              <SmallAction
                busy={updatingMemberId === member.id}
                label="Attended"
                onPress={() => void update(member, 'ATTENDED')}
                tone="approve"
              />
              <SmallAction
                busy={updatingMemberId === member.id}
                label="No-show"
                onPress={() => void update(member, 'NO_SHOW')}
                tone="decline"
              />
            </View>
          )}
        />
        {finished.length ? (
          <MemberSection
            title="Recorded outcomes"
            members={finished}
            empty=""
            renderActions={() => null}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function FeedbackInsights({ insights }: { insights: EventFeedbackInsights }) {
  const rating = insights.averageRating?.toFixed(1) ?? 'No rating yet';

  return (
    <View style={styles.insightPanel}>
      <View style={styles.insightHeader}>
        <View>
          <Text style={styles.insightEyebrow}>Feedback insights</Text>
          <Text style={styles.insightTitle}>{rating}</Text>
          <Text style={styles.insightText}>
            {insights.responseCount} response
            {insights.responseCount === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={styles.insightIcon}>
          <Star
            color={colors.accent}
            fill={colors.accent}
            size={22}
            strokeWidth={2.3}
          />
        </View>
      </View>
      {insights.comments.length ? (
        <View style={styles.commentList}>
          {insights.comments.map((comment) => (
            <View
              key={`${comment.createdAt}-${comment.rating}`}
              style={styles.comment}
            >
              <Text style={styles.commentRating}>{comment.rating}/5</Text>
              <Text style={styles.commentText}>{comment.body}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.insightEmpty}>
          Comments will appear here without member names after feedback is
          submitted.
        </Text>
      )}
    </View>
  );
}

function MemberSection({
  empty,
  members,
  renderActions,
  title,
}: {
  empty: string;
  members: EventMember[];
  renderActions: (member: EventMember) => React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.count}>{members.length}</Text>
      </View>
      {members.length ? (
        <View style={styles.memberList}>
          {members.map((member) => (
            <MemberRow key={member.id} member={member}>
              {renderActions(member)}
            </MemberRow>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>{empty}</Text>
      )}
    </View>
  );
}

function MemberRow({
  children,
  member,
}: {
  children: React.ReactNode;
  member: EventMember;
}) {
  const name = member.user.displayName ?? member.user.username ?? 'Niva member';
  return (
    <View style={styles.member}>
      <View style={styles.memberHeader}>
        <View style={styles.memberIcon}>
          <UsersRound color={colors.info} size={18} strokeWidth={2.3} />
        </View>
        <View style={styles.memberCopy}>
          <Text style={styles.memberName}>{name}</Text>
          {member.user.profile?.interests?.length ? (
            <Text style={styles.memberInterests} numberOfLines={1}>
              {member.user.profile.interests.slice(0, 3).join(' · ')}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function SmallAction({
  busy,
  label,
  onPress,
  tone,
}: {
  busy: boolean;
  label: string;
  onPress: () => void;
  tone: 'approve' | 'decline';
}) {
  const Icon =
    tone === 'approve' ? Check : tone === 'decline' ? X : CircleAlert;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={[
        styles.smallAction,
        tone === 'approve' ? styles.approveAction : styles.declineAction,
        busy && styles.busy,
      ]}
    >
      <Icon
        color={tone === 'approve' ? colors.surface : colors.primaryDark}
        size={16}
        strokeWidth={2.5}
      />
      <Text
        style={[
          styles.smallActionText,
          tone === 'decline' && styles.declineActionText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  approveAction: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  busy: { opacity: 0.55 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  comment: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    gap: 4,
    padding: spacing.sm,
  },
  commentList: { gap: spacing.sm, marginTop: spacing.md },
  commentRating: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  commentText: {
    color: colors.ink,
    fontSize: typography.small,
    lineHeight: 20,
  },
  count: { color: colors.muted, fontSize: typography.small, fontWeight: '800' },
  declineAction: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  declineActionText: { color: colors.primaryDark },
  empty: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    paddingVertical: spacing.sm,
  },
  error: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  eventTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  insightEmpty: {
    color: colors.secondary,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: spacing.md,
  },
  insightEyebrow: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  insightHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  insightPanel: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  insightText: {
    color: colors.secondary,
    fontSize: typography.small,
    marginTop: 2,
  },
  insightTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    marginTop: 2,
  },
  member: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  memberCopy: { flex: 1 },
  memberHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  memberIcon: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  memberInterests: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 2,
  },
  memberList: { gap: spacing.sm },
  memberName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  section: { marginTop: spacing.xl },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  smallAction: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 40,
  },
  smallActionText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
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
