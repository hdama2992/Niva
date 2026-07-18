import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Edit3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DeckTopBar } from '../components/DeckTopBar';
import { resolveActivityArtwork } from '../constants/activity-artwork';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';
import {
  CircleMember,
  listCircleMembers,
  updateCircleMembership,
} from '../services/community';

type ManageCircleScreenProps = {
  circle: DiscoveryItem;
  idToken: string;
  onBack: () => void;
  onEdit?: () => void;
  onOpenChat?: () => void;
};

export function ManageCircleScreen({
  circle,
  idToken,
  onBack,
  onEdit,
  onOpenChat,
}: ManageCircleScreenProps) {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [error, setError] = useState<string>();
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [membersOpen, setMembersOpen] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string>();
  const circleId = circle.remoteId ?? circle.id;

  const load = async () => {
    try {
      const payload = await listCircleMembers(idToken, circleId);
      setMembers(payload.members);
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
  }, [circleId, idToken]);

  const update = async (
    member: CircleMember,
    status: 'APPROVED' | 'CANCELLED',
  ) => {
    setUpdatingMemberId(member.id);
    try {
      await updateCircleMembership(idToken, circleId, member.id, status);
      await load();
      setReviewIndex(0);
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
  const approved = members.filter((member) => member.status === 'APPROVED');

  if (reviewMode)
    return (
      <CircleRequestReview
        approvedCount={approved.length}
        busyId={updatingMemberId}
        capacity={circle.capacity ?? 6}
        index={Math.min(reviewIndex, Math.max(pending.length - 1, 0))}
        members={pending}
        onBack={() => setReviewMode(false)}
        onNext={() =>
          setReviewIndex((value) =>
            pending.length ? (value + 1) % pending.length : 0,
          )
        }
        onUpdate={update}
        title={circle.title}
      />
    );
  if (membersOpen)
    return (
      <View style={styles.screen}>
        <DeckTopBar
          onBack={() => setMembersOpen(false)}
          title="Circle members"
        />
        <ScrollView contentContainerStyle={styles.content}>
          {approved.length ? (
            approved.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))
          ) : (
            <Text style={styles.empty}>Approved members will appear here.</Text>
          )}
        </ScrollView>
      </View>
    );

  return (
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack} title="Manage plan" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          imageStyle={styles.previewImage}
          source={resolveActivityArtwork(circle)}
          style={styles.preview}
        >
          <View style={styles.previewShade} />
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>RECURRING</Text>
          </View>
          <View style={styles.previewCopy}>
            <Text style={styles.previewTitle}>{circle.title}</Text>
            <View style={styles.previewMetaRow}>
              <CalendarDays color={colors.surface} size={18} />
              <Text style={styles.previewMeta}>
                {circle.schedule ?? circle.time}
              </Text>
            </View>
            <View style={styles.previewMetaRow}>
              <MapPin color={colors.surface} size={18} />
              <Text style={styles.previewMeta}>{circle.location}</Text>
            </View>
            <View style={styles.publishedRow}>
              <CheckCircle2 color="#8BD196" size={18} />
              <Text style={styles.publishedText}>Published</Text>
            </View>
          </View>
        </ImageBackground>
        {pending.length ? (
          <View style={styles.requestBanner}>
            <View style={styles.requestIcon}>
              <UsersRound color={colors.warning} size={23} />
            </View>
            <View style={styles.requestCopy}>
              <Text style={styles.requestTitle}>
                {pending.length} join request{pending.length === 1 ? '' : 's'}{' '}
                need a response
              </Text>
              <Text style={styles.requestText}>
                People want to join your circle.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setReviewMode(true)}
              style={styles.reviewButton}
            >
              <Text style={styles.reviewText}>Review</Text>
            </Pressable>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.menuCard}>
          <MenuRow
            Icon={UsersRound}
            onPress={() => setMembersOpen(true)}
            subtitle={`${approved.length} approved`}
            title="Members"
          />
          <MenuRow
            Icon={MessageCircle}
            onPress={onOpenChat ?? (() => undefined)}
            subtitle="Coordinate with the same group"
            title="Group chat"
          />
          <MenuRow
            Icon={MapPin}
            onPress={onEdit ?? (() => undefined)}
            subtitle={`${circle.schedule ?? circle.time} · ${circle.location}`}
            title="Schedule & location"
          />
          <MenuRow
            Icon={Edit3}
            onPress={onEdit ?? (() => undefined)}
            subtitle="Update circle details and settings"
            title="Edit plan"
          />
        </View>
        <View style={styles.readyStrip}>
          <CheckCircle2 color={colors.success} size={20} />
          <Text style={styles.readyText}>
            {circle.coverImageUrl
              ? 'Cover photo added'
              : 'Category artwork ready'}{' '}
            ·{' '}
            {circle.hostNote
              ? 'Host note added'
              : 'Add a host note in Edit plan'}{' '}
            · Recurring schedule ready
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuRow({
  Icon,
  onPress,
  subtitle,
  title,
}: {
  Icon: typeof UsersRound;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.menuRow}
    >
      <View style={styles.menuIcon}>
        <Icon color={colors.success} size={22} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.menuSubtitle}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight color={colors.muted} size={21} />
    </Pressable>
  );
}

function CircleRequestReview({
  approvedCount,
  busyId,
  capacity,
  index,
  members,
  onBack,
  onNext,
  onUpdate,
  title,
}: {
  approvedCount: number;
  busyId?: string;
  capacity: number;
  index: number;
  members: CircleMember[];
  onBack: () => void;
  onNext: () => void;
  onUpdate: (member: CircleMember, status: 'APPROVED' | 'CANCELLED') => void;
  title: string;
}) {
  const member = members[index];
  if (!member)
    return (
      <View style={styles.screen}>
        <DeckTopBar onBack={onBack} title="Review requests" />
        <View style={styles.noRequests}>
          <ShieldCheck color={colors.success} size={42} />
          <Text style={styles.noRequestsTitle}>All caught up</Text>
          <Text style={styles.empty}>
            There are no requests waiting for review.
          </Text>
        </View>
      </View>
    );
  const profile = member.user.profile;
  const name = member.user.displayName ?? member.user.username ?? 'Niva member';
  return (
    <View style={styles.screen}>
      <DeckTopBar onBack={onBack} />
      <ScrollView contentContainerStyle={styles.reviewContent}>
        <Text style={styles.reviewHeading}>Review requests</Text>
        <Text style={styles.reviewSubtitle}>
          {title} · {members.length} pending
        </Text>
        <Text style={styles.spotsText}>
          <Text style={styles.spotsStrong}>
            {approvedCount} of {capacity}
          </Text>{' '}
          spots filled
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, capacity ? (approvedCount / capacity) * 100 : 0)}%`,
              },
            ]}
          />
        </View>
        {profile?.profilePhotoUrl ? (
          <Image
            source={{ uri: profile.profilePhotoUrl }}
            style={styles.memberPhoto}
          />
        ) : (
          <View style={styles.memberPhotoFallback}>
            <Text style={styles.memberPhotoInitial}>
              {name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.memberName}>{name}</Text>
        <View style={styles.cityRow}>
          <MapPin color={colors.muted} size={20} />
          <Text style={styles.memberCity}>
            {profile?.city ?? 'City not provided'}
          </Text>
        </View>
        {profile?.interests?.length ? (
          <View style={styles.interests}>
            {profile.interests.slice(0, 4).map((interest) => (
              <View key={interest} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {member.user.trust?.verificationStatus === 'VERIFIED' ? (
          <View style={styles.verifiedRow}>
            <ShieldCheck color={colors.success} size={20} />
            <Text style={styles.verifiedText}>Profile verified</Text>
          </View>
        ) : null}
        <Text style={styles.memberBio}>
          {profile?.bio || 'This member has not added an introduction yet.'}
        </Text>
        <View style={styles.reviewActions}>
          <Pressable
            accessibilityRole="button"
            disabled={busyId === member.id}
            onPress={() => onUpdate(member, 'APPROVED')}
            style={[
              styles.approveButton,
              busyId === member.id && styles.disabled,
            ]}
          >
            <Text style={styles.approveText}>Approve request</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busyId === member.id}
            onPress={() => onUpdate(member, 'CANCELLED')}
            style={[
              styles.declineButton,
              busyId === member.id && styles.disabled,
            ]}
          >
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
        </View>
        {members.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            onPress={onNext}
            style={styles.nextButton}
          >
            <Text style={styles.nextText}>View next request</Text>
            <ChevronRight color={colors.primary} size={20} />
          </Pressable>
        ) : null}
        <View style={styles.reviewPrivacy}>
          <ShieldCheck color={colors.success} size={20} />
          <Text style={styles.reviewPrivacyText}>
            Only use information shared on the member’s Niva profile.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MemberCard({ member }: { member: CircleMember }) {
  const name = member.user.displayName ?? member.user.username ?? 'Niva member';
  return (
    <View style={styles.memberCard}>
      <View style={styles.smallAvatar}>
        {member.user.profile?.profilePhotoUrl ? (
          <Image
            source={{ uri: member.user.profile.profilePhotoUrl }}
            style={styles.smallAvatarImage}
          />
        ) : (
          <Text style={styles.smallAvatarText}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{name}</Text>
        <Text style={styles.menuSubtitle}>
          {member.user.profile?.interests?.slice(0, 3).join(' · ') ||
            'Approved member'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  approveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  approveText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '900',
  },
  cityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  declineButton: {
    alignItems: 'center',
    borderColor: colors.warning,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  declineText: {
    color: colors.warning,
    fontSize: typography.body,
    fontWeight: '900',
  },
  disabled: { opacity: 0.55 },
  empty: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  error: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  interestChip: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  interestText: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: '800',
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  memberBio: {
    color: colors.primaryDark,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.lg,
  },
  memberCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  memberCity: { color: colors.muted, fontSize: typography.body },
  memberName: {
    color: colors.primaryDark,
    fontSize: 32,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  memberPhoto: {
    borderRadius: radius.lg,
    height: 360,
    marginTop: spacing.xl,
    width: '100%',
  },
  memberPhotoFallback: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    height: 300,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  memberPhotoInitial: {
    color: colors.success,
    fontSize: 84,
    fontWeight: '900',
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  menuCopy: { flex: 1 },
  menuIcon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  menuRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 78,
  },
  menuSubtitle: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 3,
  },
  menuTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '900',
  },
  nextButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 48,
  },
  nextText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '900',
  },
  noRequests: { alignItems: 'center', padding: spacing.xxl },
  noRequestsTitle: {
    color: colors.primaryDark,
    fontSize: typography.heading,
    fontWeight: '900',
    marginTop: spacing.lg,
  },
  preview: { height: 280, justifyContent: 'flex-end', overflow: 'hidden' },
  previewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  previewBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  previewCopy: { padding: spacing.lg },
  previewImage: { borderRadius: radius.lg },
  previewMeta: {
    color: colors.surface,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
  },
  previewMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  previewShade: {
    backgroundColor: 'rgba(4,32,59,0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '38%',
  },
  previewTitle: { color: colors.surface, fontSize: 30, fontWeight: '900' },
  progressFill: {
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 6,
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 6,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  publishedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  publishedText: {
    color: '#8BD196',
    fontSize: typography.small,
    fontWeight: '900',
  },
  readyStrip: {
    alignItems: 'flex-start',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  readyText: { color: colors.success, flex: 1, fontSize: 12, lineHeight: 18 },
  requestBanner: {
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
    borderColor: '#F2D6C9',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  requestCopy: { flex: 1 },
  requestIcon: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  requestText: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 3,
  },
  requestTitle: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '900',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  reviewButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reviewContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  reviewHeading: { color: colors.primaryDark, fontSize: 34, fontWeight: '900' },
  reviewPrivacy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  reviewPrivacyText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 20,
  },
  reviewSubtitle: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: 3,
  },
  reviewText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '900',
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  smallAvatar: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  smallAvatarImage: { height: '100%', width: '100%' },
  smallAvatarText: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '900',
  },
  spotsStrong: { color: colors.success, fontWeight: '900' },
  spotsText: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.xl,
  },
  verifiedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  verifiedText: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
