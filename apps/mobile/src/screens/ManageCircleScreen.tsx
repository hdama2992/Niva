import { ArrowLeft, Check, UsersRound, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
};

export function ManageCircleScreen({
  circle,
  idToken,
  onBack,
}: ManageCircleScreenProps) {
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [error, setError] = useState<string>();
  const [updatingMemberId, setUpdatingMemberId] = useState<string>();
  const circleId = circle.remoteId ?? circle.id;

  const load = async () => {
    try {
      const payload = await listCircleMembers(idToken, circleId);
      setMembers(payload.members);
      setError(undefined);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Unable to load members.',
      );
    }
  };

  useEffect(() => {
    void load();
  }, [circleId, idToken]);

  const update = async (member: CircleMember, status: 'APPROVED' | 'CANCELLED') => {
    try {
      setUpdatingMemberId(member.id);
      await updateCircleMembership(idToken, circleId, member.id, status);
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
  const approved = members.filter((member) => member.status === 'APPROVED');

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" hitSlop={10} onPress={onBack} style={styles.iconButton}>
          <ArrowLeft color={colors.ink} size={22} strokeWidth={2.4} />
        </Pressable>
        <Text numberOfLines={1} style={styles.topBarTitle}>Manage circle</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{circle.title}</Text>
        <Text style={styles.subtitle}>Approve members deliberately. Approved members can enter the circle chat and return for the full cohort.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <MemberSection empty="No requests waiting for review." members={pending} title="Join requests" renderActions={(member) => <View style={styles.actions}><Action busy={updatingMemberId === member.id} label="Approve" onPress={() => void update(member, 'APPROVED')} tone="approve" /><Action busy={updatingMemberId === member.id} label="Decline" onPress={() => void update(member, 'CANCELLED')} tone="decline" /></View>} />
        <MemberSection empty="No members have been approved yet." members={approved} title="Confirmed members" renderActions={() => null} />
      </ScrollView>
    </View>
  );
}

function MemberSection({ empty, members, renderActions, title }: { empty: string; members: CircleMember[]; renderActions: (member: CircleMember) => React.ReactNode; title: string }) {
  return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.count}>{members.length}</Text></View>{members.length ? <View style={styles.list}>{members.map((member) => <MemberCard key={member.id} member={member}>{renderActions(member)}</MemberCard>)}</View> : <Text style={styles.empty}>{empty}</Text>}</View>;
}

function MemberCard({ children, member }: { children: React.ReactNode; member: CircleMember }) {
  const name = member.user.displayName ?? member.user.username ?? 'Niva member';
  return <View style={styles.member}><View style={styles.memberHeader}><View style={styles.memberIcon}><UsersRound color={colors.info} size={18} strokeWidth={2.3} /></View><View style={styles.memberCopy}><Text style={styles.memberName}>{name}</Text>{member.user.profile?.interests?.length ? <Text numberOfLines={1} style={styles.memberInterests}>{member.user.profile.interests.slice(0, 3).join(' · ')}</Text> : null}</View></View>{children}</View>;
}

function Action({ busy, label, onPress, tone }: { busy: boolean; label: string; onPress: () => void; tone: 'approve' | 'decline' }) {
  const Icon = tone === 'approve' ? Check : X;
  return <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={[styles.action, tone === 'approve' ? styles.approve : styles.decline, busy && styles.busy]}><Icon color={tone === 'approve' ? colors.surface : colors.primaryDark} size={16} strokeWidth={2.5} /><Text style={[styles.actionText, tone === 'decline' && styles.declineText]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 5, justifyContent: 'center', minHeight: 40 },
  actionText: { color: colors.surface, fontSize: typography.small, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  approve: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  busy: { opacity: 0.55 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  count: { color: colors.muted, fontSize: typography.small, fontWeight: '800' },
  decline: { backgroundColor: colors.surface, borderColor: colors.primary },
  declineText: { color: colors.primaryDark },
  empty: { color: colors.muted, fontSize: typography.small, lineHeight: 20, paddingVertical: spacing.sm },
  error: { color: colors.primaryDark, fontSize: typography.small, fontWeight: '700', marginTop: spacing.md },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  list: { gap: spacing.sm },
  member: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  memberCopy: { flex: 1 },
  memberHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  memberIcon: { alignItems: 'center', backgroundColor: colors.infoSoft, borderRadius: radius.pill, height: 34, justifyContent: 'center', width: 34 },
  memberInterests: { color: colors.muted, fontSize: typography.small, marginTop: 2 },
  memberName: { color: colors.ink, fontSize: typography.body, fontWeight: '800' },
  screen: { backgroundColor: colors.background, flex: 1 },
  section: { marginTop: spacing.xl },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.ink, fontSize: typography.subheading, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  title: { color: colors.ink, fontSize: typography.heading, fontWeight: '800' },
  topBar: { alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 60, paddingHorizontal: spacing.sm },
  topBarTitle: { color: colors.ink, fontSize: typography.body, fontWeight: '800' },
});
