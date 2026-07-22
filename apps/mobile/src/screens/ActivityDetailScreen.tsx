import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Bookmark,
  CalendarDays,
  Check,
  Flag,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react-native';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { resolveActivityArtwork } from '../constants/activity-artwork';
import { hostToolsEnabled } from '../constants/features';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';
import { IcebreakerMember } from '../services/community';

type ActivityDetailScreenProps = {
  attendees: IcebreakerMember[];
  blocked: boolean;
  isHost: boolean;
  item: DiscoveryItem;
  onBack: () => void;
  onBlock: () => void;
  onEdit: () => void;
  onIcebreakers: () => void;
  onJoin: () => void;
  onOpenChat: () => void;
  onReport: () => void;
  onLeave: () => void;
  onManage: () => void;
};

export function ActivityDetailScreen({
  attendees,
  blocked,
  isHost,
  item,
  onBack,
  onBlock,
  onEdit,
  onIcebreakers,
  onJoin,
  onOpenChat,
  onReport,
  onLeave,
  onManage,
}: ActivityDetailScreenProps) {
  const approved =
    isHost ||
    item.membershipStatus === 'APPROVED' ||
    item.membershipStatus === 'ATTENDED';
  const pending = item.membershipStatus === 'REQUESTED';
  const cancelled = item.activityStatus === 'CANCELLED';
  const canJoin =
    !cancelled &&
    Boolean(item.remoteId) &&
    item.seats !== 0 &&
    !item.membershipStatus &&
    !isHost;
  const canLeave =
    !isHost && !cancelled && (pending || item.membershipStatus === 'APPROVED');
  const formattedDate = formatDetailDate(item.startsAt, item.time);
  const hostName = item.host.replace('Hosted by ', '').replace('Led by ', '');
  const hostIntroduction = item.hostNote ?? item.hostBio;

  const openMaps = () => {
    if (item.latitude !== undefined && item.longitude !== undefined) {
      return Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`,
      );
    }
    return Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.location}, ${item.city ?? ''}`)}`,
    );
  };

  const addToCalendar = () => {
    const startsAt = item.startsAt ? new Date(item.startsAt) : new Date();
    const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000);
    const date = (value: Date) =>
      value
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z');
    return Linking.openURL(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title)}&dates=${date(startsAt)}/${date(endsAt)}&location=${encodeURIComponent(item.location)}&details=${encodeURIComponent(item.summary)}`,
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, approved && styles.heroApproved]}>
          <Image
            resizeMode="contain"
            source={resolveActivityArtwork(item)}
            style={styles.heroImage}
          />
          <View style={styles.heroShade} />
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={onBack}
            style={[styles.glassIcon, styles.backButton]}
          >
            <ArrowLeft color={colors.surface} size={25} strokeWidth={2.5} />
          </Pressable>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityLabel="Save activity"
              accessibilityRole="button"
              style={styles.glassIcon}
            >
              <Bookmark color={colors.surface} size={21} strokeWidth={2.3} />
            </Pressable>
            <Pressable
              accessibilityLabel="Share activity"
              accessibilityRole="button"
              onPress={() =>
                void Share.share({
                  message: `${item.title} · ${formattedDate} · ${item.location}`,
                  title: item.title,
                })
              }
              style={styles.glassIcon}
            >
              <Share2 color={colors.surface} size={21} strokeWidth={2.3} />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          {approved && !isHost ? (
            <View style={styles.approvedBanner}>
              <View style={styles.approvedIcon}>
                <Check color={colors.surface} size={24} strokeWidth={3} />
              </View>
              <View>
                <Text style={styles.approvedTitle}>You’re going</Text>
                <Text style={styles.approvedText}>Approved by {hostName}</Text>
              </View>
            </View>
          ) : pending ? (
            <View style={styles.pendingBanner}>
              <ShieldCheck color={colors.warning} size={22} strokeWidth={2.4} />
              <View style={styles.flex}>
                <Text style={styles.pendingTitle}>Request pending</Text>
                <Text style={styles.pendingText}>
                  The host will review it before profiles and chat unlock.
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.primaryMeta}>
            <CalendarDays color={colors.warning} size={22} strokeWidth={2.3} />
            <Text style={styles.primaryMetaText}>{formattedDate}</Text>
          </View>
          <View style={styles.locationRow}>
            <MapPin color={colors.info} size={23} strokeWidth={2.3} />
            <View style={styles.flex}>
              <Text numberOfLines={2} style={styles.location}>
                {item.location}
              </Text>
              {!approved ? (
                <View style={styles.lockRow}>
                  <LockKeyhole
                    color={colors.muted}
                    size={13}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.lockText}>
                    Exact location unlocks after approval
                  </Text>
                </View>
              ) : null}
            </View>
            {approved ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => void openMaps()}
                style={styles.outlineAction}
              >
                <Text style={styles.outlineActionText}>Open in Maps</Text>
              </Pressable>
            ) : null}
          </View>

          {!approved ? (
            <View style={styles.capacityRow}>
              <UsersRound
                color={colors.secondary}
                size={21}
                strokeWidth={2.3}
              />
              <Text style={styles.capacityText}>
                {item.capacity && item.seats !== undefined
                  ? `${item.capacity - item.seats} of ${item.capacity} going`
                  : item.seats !== undefined
                    ? `${item.seats} spots left`
                    : 'Availability with host'}
              </Text>
            </View>
          ) : null}

          {!approved ? (
            <Text style={styles.summary}>{item.summary}</Text>
          ) : null}

          <View style={styles.hostRow}>
            <Avatar label={hostName} size={52} uri={item.hostProfilePhotoUrl} />
            <View style={styles.flex}>
              <Text style={styles.hostTitle}>Hosted by {hostName}</Text>
              <View style={styles.verifiedRow}>
                <ShieldCheck
                  color={colors.success}
                  size={16}
                  strokeWidth={2.4}
                />
                <Text style={styles.verifiedText}>Verified member</Text>
              </View>
            </View>
          </View>

          {hostIntroduction ? (
            <View style={styles.hostNote}>
              <View style={styles.hostNoteIcon}>
                <Sparkles color={colors.warning} size={20} strokeWidth={2.2} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.hostNoteLabel}>A note from {hostName}</Text>
                <Text style={styles.hostNoteText}>{hostIntroduction}</Text>
              </View>
            </View>
          ) : null}

          {approved ? (
            <ApprovedContent
              attendees={attendees}
              onAddToCalendar={() => void addToCalendar()}
              onChat={onOpenChat}
              onPeople={onIcebreakers}
            />
          ) : (
            <LockedAttendees capacity={item.capacity} seats={item.seats} />
          )}

          {!approved ? (
            <View style={styles.interests}>
              {item.interests.slice(0, 4).map((interest) => (
                <View key={interest} style={styles.interest}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {hostToolsEnabled && isHost && !cancelled ? (
            <View style={styles.hostActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onManage}
                style={styles.hostPrimaryAction}
              >
                <UsersRound
                  color={colors.surface}
                  size={18}
                  strokeWidth={2.4}
                />
                <Text style={styles.hostPrimaryText}>Manage members</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onEdit}
                style={styles.hostSecondaryAction}
              >
                <Text style={styles.hostSecondaryText}>Edit details</Text>
              </Pressable>
            </View>
          ) : null}

          {item.hostId && !isHost ? (
            <View style={styles.safetyActions}>
              <Pressable
                disabled={blocked}
                onPress={onBlock}
                style={styles.safetyAction}
              >
                <Ban color={colors.warning} size={16} strokeWidth={2.3} />
                <Text style={styles.safetyText}>
                  {blocked ? 'Host blocked' : 'Block host'}
                </Text>
              </Pressable>
              <Pressable onPress={onReport} style={styles.safetyAction}>
                <Flag color={colors.primary} size={16} strokeWidth={2.3} />
                <Text style={styles.safetyText}>Report</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {!isHost && !cancelled ? (
        <View style={styles.stickyGlass}>
          {approved ? (
            <Pressable onPress={onOpenChat} style={styles.primaryAction}>
              <MessageCircle
                color={colors.surface}
                size={21}
                strokeWidth={2.4}
              />
              <Text style={styles.primaryActionText}>Open group chat</Text>
              <ArrowRight color={colors.surface} size={20} strokeWidth={2.5} />
            </Pressable>
          ) : canJoin ? (
            <Pressable onPress={onJoin} style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>Request to join</Text>
              <ArrowRight color={colors.surface} size={20} strokeWidth={2.5} />
            </Pressable>
          ) : null}
          {canJoin ? (
            <Text style={styles.stickyHelper}>
              Usually reviewed within a few hours
            </Text>
          ) : canLeave ? (
            <Pressable onPress={onLeave} style={styles.leaveAction}>
              <Text style={styles.leaveText}>
                {pending ? 'Withdraw request' : 'Can’t make it? Leave plan'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ApprovedContent({
  attendees,
  onAddToCalendar,
  onChat,
  onPeople,
}: {
  attendees: IcebreakerMember[];
  onAddToCalendar: () => void;
  onChat: () => void;
  onPeople: () => void;
}) {
  const { width } = useWindowDimensions();
  const visible = attendees.slice(0, 4);
  const avatarSize = width < 380 ? 54 : 68;

  return (
    <>
      <View style={styles.sectionDivider} />
      <Text style={styles.sectionTitle}>Your circle</Text>
      {visible.length ? (
        <View style={styles.attendees}>
          {visible.map((member) => (
            <View key={member.id} style={styles.attendee}>
              <Avatar
                label={member.displayName ?? 'Member'}
                size={avatarSize}
                uri={member.profilePhotoUrl ?? undefined}
              />
              <Text numberOfLines={1} style={styles.attendeeName}>
                {(member.displayName ?? 'Member').split(' ')[0]}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.attendeesEmpty}>
          <UsersRound color={colors.secondary} size={22} strokeWidth={2.2} />
          <Text style={styles.attendeesEmptyText}>
            Approved member profiles will appear here as the plan fills.
          </Text>
        </View>
      )}
      <View style={styles.approvedProfilesRow}>
        <ShieldCheck color={colors.success} size={16} strokeWidth={2.4} />
        <Text style={styles.approvedProfilesText}>
          Profiles approved by Niva
        </Text>
      </View>
      <View style={styles.actionTiles}>
        <Pressable onPress={onChat} style={styles.actionTile}>
          <MessageCircle color={colors.info} size={24} strokeWidth={2.2} />
          <View style={styles.flex}>
            <Text style={styles.actionTileTitle}>Group chat</Text>
            <Text style={styles.actionTileText}>Coordinate with the group</Text>
          </View>
          <ArrowRight color={colors.muted} size={18} strokeWidth={2.3} />
        </Pressable>
        <Pressable onPress={onPeople} style={styles.actionTile}>
          <Sparkles color={colors.warning} size={24} strokeWidth={2.2} />
          <View style={styles.flex}>
            <Text style={styles.actionTileTitle}>Meet your circle</Text>
            <Text style={styles.actionTileText}>
              Shared interests & prompts
            </Text>
          </View>
          <ArrowRight color={colors.muted} size={18} strokeWidth={2.3} />
        </Pressable>
      </View>
      <Pressable onPress={onAddToCalendar} style={styles.calendarRow}>
        <CalendarDays color={colors.secondary} size={20} strokeWidth={2.3} />
        <Text style={styles.calendarCopy}>Reminder · 1 hour before</Text>
        <Text style={styles.calendarAction}>Add to calendar</Text>
      </Pressable>
    </>
  );
}

function LockedAttendees({
  capacity,
  seats,
}: {
  capacity?: number;
  seats?: number;
}) {
  const going = capacity && seats !== undefined ? capacity - seats : 4;
  return (
    <View style={styles.lockedAttendees}>
      <View style={styles.lockedAvatarStack}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.lockedAvatar,
              index > 0 && styles.lockedAvatarOverlap,
            ]}
          >
            <UsersRound color={colors.secondary} size={18} strokeWidth={2.1} />
          </View>
        ))}
      </View>
      <View style={styles.flex}>
        <Text style={styles.lockedAttendeesTitle}>
          {going} approved members are going
        </Text>
        <View style={styles.lockRow}>
          <LockKeyhole color={colors.muted} size={13} strokeWidth={2.2} />
          <Text style={styles.lockText}>Profiles unlock after approval</Text>
        </View>
      </View>
    </View>
  );
}

function Avatar({
  label,
  size,
  uri,
}: {
  label: string;
  size: number;
  uri?: string;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ borderRadius: size / 2, height: size, width: size }}
      />
    );
  }

  return (
    <View
      style={[
        styles.initialAvatar,
        { borderRadius: size / 2, height: size, width: size },
      ]}
    >
      <Text style={styles.initialAvatarText}>
        {label.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

function formatDetailDate(startsAt?: string, fallback?: string) {
  if (!startsAt) {
    return fallback ?? 'Time with host';
  }
  return new Date(startsAt).toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    weekday: 'short',
  });
}

const styles = StyleSheet.create({
  actionTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 84,
    padding: spacing.md,
  },
  actionTileText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  actionTileTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  actionTiles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  approvedBanner: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  approvedIcon: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  approvedProfilesRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  approvedProfilesText: { color: colors.muted, fontSize: typography.small },
  approvedText: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 2,
  },
  approvedTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  attendee: { alignItems: 'center', flex: 1, gap: spacing.xs, minWidth: 0 },
  attendeeName: { color: colors.ink, fontSize: typography.small, maxWidth: 72 },
  attendees: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  attendeesEmpty: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  attendeesEmptyText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.small,
    lineHeight: 19,
  },
  backButton: { left: spacing.md, position: 'absolute', top: spacing.lg },
  calendarAction: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '800',
  },
  calendarCopy: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
  },
  calendarRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    minHeight: 58,
  },
  capacityRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  capacityText: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '800',
  },
  content: { padding: spacing.lg },
  flex: { flex: 1 },
  glassIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(23,52,91,0.42)',
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  hero: {
    aspectRatio: 3 / 2,
    backgroundColor: colors.primary,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    top: spacing.lg,
  },
  heroApproved: {},
  heroImage: { height: '100%', width: '100%' },
  heroShade: {
    backgroundColor: 'rgba(16,39,66,0.12)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  hostActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 72,
    marginTop: spacing.lg,
  },
  hostNote: {
    alignItems: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  hostNoteIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  hostNoteLabel: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '900',
  },
  hostNoteText: {
    color: colors.ink,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: 4,
  },
  hostPrimaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
  },
  hostPrimaryText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
  },
  hostRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  hostSecondaryAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  hostSecondaryText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  hostTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  initialAvatar: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    justifyContent: 'center',
  },
  initialAvatarText: {
    color: colors.primary,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  interest: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  interestText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '700',
  },
  leaveAction: {
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  leaveText: {
    color: colors.info,
    fontSize: typography.small,
    fontWeight: '800',
  },
  location: { color: colors.ink, fontSize: typography.body, fontWeight: '800' },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  lockRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  lockedAttendees: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  lockedAttendeesTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  lockedAvatar: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  lockedAvatarOverlap: { marginLeft: -12 },
  lockedAvatarStack: { flexDirection: 'row' },
  lockText: { color: colors.muted, fontSize: 12 },
  outlineAction: {
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  outlineActionText: { color: colors.info, fontSize: 12, fontWeight: '800' },
  pendingBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  pendingText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 2,
  },
  pendingTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: spacing.lg,
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  primaryMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryMetaText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  safetyAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
  },
  safetyActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  safetyText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  screen: { backgroundColor: colors.background, flex: 1 },
  scrollContent: { paddingBottom: 150 },
  sectionDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  stickyGlass: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: spacing.sm,
    gap: spacing.xs,
    left: spacing.md,
    padding: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  stickyHelper: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  summary: {
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.lg,
  },
  title: {
    color: colors.primaryDark,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  verifiedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  verifiedText: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: '700',
  },
});
