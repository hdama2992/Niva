import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MapPin,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import { ReactNode } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { DiscoveryItem } from '../data/discovery';

type ActivityDetailScreenProps = {
  blocked: boolean;
  isHost: boolean;
  item: DiscoveryItem;
  onBack: () => void;
  onBlock: () => void;
  onEdit: () => void;
  onIcebreakers: () => void;
  onJoin: () => void;
  onLeave: () => void;
  onManage: () => void;
};

export function ActivityDetailScreen({
  blocked,
  isHost,
  item,
  onBack,
  onBlock,
  onEdit,
  onIcebreakers,
  onJoin,
  onLeave,
  onManage,
}: ActivityDetailScreenProps) {
  const membershipLabel = formatMembershipStatus(item.membershipStatus);
  const cancelled = item.activityStatus === 'CANCELLED';
  const canJoin =
    !cancelled &&
    Boolean(item.remoteId) &&
    item.seats !== 0 &&
    !item.membershipStatus;
  const canLeave =
    !cancelled &&
    (item.membershipStatus === 'REQUESTED' ||
      item.membershipStatus === 'APPROVED');
  const canOpenIcebreakers =
    item.membershipStatus === 'APPROVED' ||
    item.membershipStatus === 'ATTENDED';

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
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {item.category === 'circle' ? 'Circle details' : 'Event details'}
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.category}>
          {item.category === 'circle' ? 'Recurring circle' : 'Small event'}
        </Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.summary}>{item.summary}</Text>

        {cancelled ? (
          <View style={styles.cancelledBanner}>
            <CircleAlert color={colors.primary} size={21} strokeWidth={2.4} />
            <View style={styles.statusCopy}>
              <Text style={styles.cancelledTitle}>
                This activity was cancelled
              </Text>
              <Text style={styles.statusText}>
                {item.cancellationReason ??
                  'The host will share a new plan if one is available.'}
              </Text>
            </View>
          </View>
        ) : null}

        {membershipLabel ? (
          <View style={styles.statusBanner}>
            <CheckCircle2
              color={colors.secondary}
              size={20}
              strokeWidth={2.4}
            />
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>{membershipLabel}</Text>
              <Text style={styles.statusText}>
                {item.membershipStatus === 'REQUESTED'
                  ? 'The host will review your request before cohort chat opens.'
                  : 'This activity is saved in your plans.'}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.metaGrid}>
          <InfoTile
            icon={
              <CalendarDays
                color={colors.primary}
                size={20}
                strokeWidth={2.3}
              />
            }
            label="When"
            value={item.time}
          />
          <InfoTile
            icon={
              <MapPin color={colors.secondary} size={20} strokeWidth={2.3} />
            }
            label="Where"
            value={item.location}
          />
          <InfoTile
            icon={
              <UsersRound color={colors.info} size={20} strokeWidth={2.3} />
            }
            label="Availability"
            value={
              item.seats === undefined
                ? 'Check with host'
                : `${item.seats} spots left`
            }
          />
          <InfoTile
            icon={<Clock3 color={colors.warning} size={20} strokeWidth={2.3} />}
            label="Format"
            value={item.duration ?? item.difficulty ?? 'Social'}
          />
        </View>

        {item.latitude !== undefined && item.longitude !== undefined ? (
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`,
              )
            }
            style={styles.directionsAction}
          >
            <MapPin color={colors.secondary} size={18} strokeWidth={2.4} />
            <Text style={styles.directionsText}>Open directions</Text>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Designed around</Text>
          <View style={styles.interestList}>
            {item.interests.map((interest) => (
              <Text key={interest} style={styles.interest}>
                {interest}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.hostPanel}>
          <View style={styles.hostIcon}>
            <ShieldCheck color={colors.secondary} size={22} strokeWidth={2.4} />
          </View>
          <View style={styles.hostCopy}>
            <Text style={styles.hostTitle}>{item.host}</Text>
            <Text style={styles.hostText}>
              Member details and the cohort chat are shared only after your
              request is approved.
            </Text>
          </View>
        </View>

        {item.hostId && !isHost ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBlock}
            style={styles.blockAction}
          >
            <Ban color={colors.warning} size={18} strokeWidth={2.4} />
            <Text style={styles.blockText}>
              {blocked ? 'Host blocked' : 'Block this host'}
            </Text>
          </Pressable>
        ) : null}

        {isHost &&
        !cancelled &&
        (item.category === 'event' || item.category === 'circle') ? (
          <View style={styles.hostActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onManage}
              style={styles.manageAction}
            >
              <UsersRound color={colors.surface} size={19} strokeWidth={2.4} />
              <Text style={styles.manageActionText}>
                {item.category === 'circle'
                  ? 'Manage circle'
                  : 'Manage members'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onEdit}
              style={styles.editAction}
            >
              <Text style={styles.editActionText}>Edit details</Text>
            </Pressable>
          </View>
        ) : null}

        {canOpenIcebreakers && !cancelled ? (
          <Pressable
            accessibilityRole="button"
            onPress={onIcebreakers}
            style={styles.icebreakerAction}
          >
            <UsersRound color={colors.secondary} size={20} strokeWidth={2.4} />
            <View style={styles.icebreakerCopy}>
              <Text style={styles.icebreakerTitle}>
                People you&apos;ll meet
              </Text>
              <Text style={styles.icebreakerText}>
                See all interests you share with approved members.
              </Text>
            </View>
          </Pressable>
        ) : null}

        {canJoin ? (
          <Pressable
            accessibilityRole="button"
            onPress={onJoin}
            style={styles.primaryAction}
          >
            <Text style={styles.primaryActionText}>Request to join</Text>
          </Pressable>
        ) : null}
        {canLeave ? (
          <Pressable
            accessibilityRole="button"
            onPress={onLeave}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionText}>
              {item.membershipStatus === 'REQUESTED'
                ? 'Withdraw request'
                : 'Leave activity'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoTile}>
      {icon}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatMembershipStatus(status: DiscoveryItem['membershipStatus']) {
  switch (status) {
    case 'APPROVED':
      return 'You are going';
    case 'ATTENDED':
      return 'Attended';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NO_SHOW':
      return 'Marked no-show';
    case 'REQUESTED':
      return 'Request pending';
    default:
      return undefined;
  }
}

const styles = StyleSheet.create({
  directionsAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    minHeight: 40,
  },
  directionsText: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  blockAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  blockText: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '800',
  },
  cancelledBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  cancelledTitle: {
    color: colors.primaryDark,
    fontSize: typography.body,
    fontWeight: '800',
  },
  category: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  editAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  editActionText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  hostCopy: {
    flex: 1,
    gap: 3,
  },
  hostActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  hostIcon: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  hostPanel: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  hostText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  hostTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  icebreakerAction: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  icebreakerCopy: { flex: 1 },
  icebreakerText: {
    color: colors.secondary,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 2,
  },
  icebreakerTitle: {
    color: colors.secondary,
    fontSize: typography.body,
    fontWeight: '800',
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  infoTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 122,
    padding: spacing.md,
  },
  infoValue: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: 3,
  },
  interest: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  interestList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  manageAction: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    flex: 1,
    minHeight: 50,
  },
  manageActionText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 54,
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  secondaryAction: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 52,
  },
  secondaryActionText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  statusBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  statusCopy: {
    flex: 1,
  },
  statusText: {
    color: colors.secondary,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 3,
  },
  statusTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  summary: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 25,
    marginTop: spacing.md,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
    lineHeight: 44,
    marginTop: spacing.xs,
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
});
