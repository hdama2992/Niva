import {
  Ban,
  Bell,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  CircleUserRound,
  Compass,
  Home,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserPlus,
  UsersRound,
} from 'lucide-react-native';
import {
  cloneElement,
  isValidElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  allDiscoveryItems,
  circles,
  DiscoveryItem,
  safetyTips,
  weeklyEvents,
  workshops,
} from '../data/discovery';
import { colors, radius, spacing, typography } from '../constants/theme';
import {
  blockUser,
  CommunityActivity,
  createEvent as createCommunityEvent,
  joinCircle,
  joinEvent,
  listCircles,
  listEvents,
  listMyActivities,
  listNotifications,
  NotificationItem,
  submitEventFeedback,
} from '../services/community';
import { NivaUser } from '../types/niva';

type HomeScreenProps = {
  idToken: string;
  user: NivaUser;
  onLogout: () => void;
  onStartVerification: (joiningTitle?: string) => void;
};

type Tab = 'home' | 'explore' | 'circles' | 'messages' | 'profile';

const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
  { id: 'home', label: 'Home', icon: <Home size={21} /> },
  { id: 'explore', label: 'Explore', icon: <Search size={21} /> },
  { id: 'circles', label: 'Circles', icon: <UsersRound size={21} /> },
  { id: 'messages', label: 'Messages', icon: <MessageCircle size={21} /> },
  { id: 'profile', label: 'Profile', icon: <CircleUserRound size={21} /> },
];

const filters = ['All', 'Fitness', 'Books', 'Wellness', 'Career', 'Safety'];

export function HomeScreen({
  idToken,
  user,
  onLogout,
  onStartVerification,
}: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [joinRequest, setJoinRequest] = useState<string>();
  const [joinCandidate, setJoinCandidate] = useState<DiscoveryItem>();
  const [selectedItem, setSelectedItem] = useState<DiscoveryItem>();
  const [feedbackCandidate, setFeedbackCandidate] = useState<DiscoveryItem>();
  const [hostToolsVisible, setHostToolsVisible] = useState(false);
  const [hostedItems, setHostedItems] = useState<DiscoveryItem[]>([]);
  const [blockedHosts, setBlockedHosts] = useState<string[]>([]);
  const [apiEvents, setApiEvents] = useState<DiscoveryItem[]>([]);
  const [apiCircles, setApiCircles] = useState<DiscoveryItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [apiError, setApiError] = useState<string>();
  const [joinedItemIds, setJoinedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const verified = user.verificationStatus === 'approved';
  const visibleEvents = apiEvents.length ? apiEvents : weeklyEvents;
  const visibleCircles = apiCircles.length ? apiCircles : circles;
  const allItems = useMemo(
    () =>
      apiEvents.length || apiCircles.length
        ? [...hostedItems, ...apiEvents, ...apiCircles, ...workshops]
        : [...hostedItems, ...allDiscoveryItems],
    [apiCircles, apiEvents, hostedItems],
  );
  const recommended = useMemo(() => {
    const userInterests = new Set(user.interests);

    return allItems.filter((item) =>
      item.interests.some((interest) => userInterests.has(interest)),
    );
  }, [allItems, user.interests]);
  const exploreResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.title} ${item.location} ${item.interests.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesFilter =
        activeFilter === 'All' || item.interests.includes(activeFilter);

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, allItems, query]);
  const joinedItems = useMemo(
    () => allItems.filter((item) => joinedItemIds.has(item.id)),
    [allItems, joinedItemIds],
  );

  useEffect(() => {
    void loadCommunityData();
  }, [idToken, user.city]);

  const loadCommunityData = async () => {
    try {
      setApiError(undefined);
      const [
        eventsPayload,
        circlesPayload,
        activitiesPayload,
        notificationsPayload,
      ] = await Promise.all([
        listEvents(idToken, user.city),
        listCircles(idToken, user.city),
        listMyActivities(idToken),
        listNotifications(idToken),
      ]);

      const events = eventsPayload.events.map((event) =>
        activityToDiscoveryItem(event, 'event'),
      );
      const circles = circlesPayload.circles.map((circle) =>
        activityToDiscoveryItem(circle, 'circle'),
      );
      const joinedIds = new Set<string>();

      activitiesPayload.events.forEach(({ event }) => joinedIds.add(event.id));
      activitiesPayload.circles.forEach(({ circle }) =>
        joinedIds.add(circle.id),
      );

      setApiEvents(events);
      setApiCircles(circles);
      setJoinedItemIds(joinedIds);
      setNotifications(notificationsPayload.notifications);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to load live Niva data.',
      );
    }
  };

  const requestJoin = (item: DiscoveryItem) => {
    if (!verified) {
      if (user.verificationStatus === 'not_started') {
        onStartVerification(item.title);
        return;
      }

      setBlockedModalVisible(true);
      return;
    }

    setJoinCandidate(item);
  };

  const confirmJoin = async () => {
    if (!joinCandidate) {
      return;
    }

    try {
      if (joinCandidate.category === 'circle') {
        await joinCircle(idToken, joinCandidate.remoteId ?? joinCandidate.id);
      } else if (joinCandidate.category === 'event') {
        await joinEvent(idToken, joinCandidate.remoteId ?? joinCandidate.id);
      }

      setJoinedItemIds((current) => new Set(current).add(joinCandidate.id));
      setJoinRequest(joinCandidate.title);
      setJoinCandidate(undefined);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to send join request.',
      );
    }
  };

  const createHostedEvent = async (title: string) => {
    try {
      const payload = await createCommunityEvent(idToken, {
        capacity: 6,
        city: user.city,
        description: 'Host-created beta event draft.',
        difficulty: 'SOCIAL',
        interests: user.interests.slice(0, 2),
        locationName: user.city,
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        title: title.trim() || 'New hosted event',
      });

      setHostedItems((current) => [
        activityToDiscoveryItem(payload.event, 'event'),
        ...current,
      ]);
      setHostToolsVisible(false);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to create event.',
      );
    }
  };

  const blockHost = async (item: DiscoveryItem) => {
    const host = item.host.replace('Hosted by ', '').replace('Led by ', '');

    try {
      if (item.hostId) {
        await blockUser(idToken, item.hostId);
      }

      setBlockedHosts((current) =>
        current.includes(host) ? current : [...current, host],
      );
      setSelectedItem(undefined);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to block this host.',
      );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <Header
              onOpenNotifications={() => setNotificationsVisible(true)}
              user={user}
            />
            <TrustCard user={user} verified={verified} />
            {apiError ? (
              <View style={styles.apiBanner}>
                <Text style={styles.apiBannerText}>{apiError}</Text>
              </View>
            ) : null}
            <Section title="This week near you">
              <HorizontalCards
                items={[...hostedItems, ...visibleEvents]}
                onJoin={requestJoin}
                onOpen={setSelectedItem}
              />
            </Section>
            <Section title="Circles starting soon">
              <HorizontalCards
                items={visibleCircles}
                onJoin={requestJoin}
                onOpen={setSelectedItem}
              />
            </Section>
            <Section title="Workshops">
              <HorizontalCards
                items={workshops}
                onJoin={requestJoin}
                onOpen={setSelectedItem}
              />
            </Section>
            <Section title="Recommended for your interests">
              {recommended.length ? (
                <VerticalCards
                  items={recommended.slice(0, 3)}
                  onJoin={requestJoin}
                  onOpen={setSelectedItem}
                />
              ) : (
                <EmptyState
                  icon={
                    <Compass color={colors.info} size={26} strokeWidth={2.3} />
                  }
                  title="No recommendations yet"
                  text="Choose a few more interests from Profile."
                />
              )}
            </Section>
            <Section title="Safety and community tips">
              <View style={styles.tipList}>
                {safetyTips.map((tip) => (
                  <View key={tip} style={styles.tipRow}>
                    <ShieldCheck
                      color={colors.secondary}
                      size={18}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </>
        );
      case 'explore':
        return (
          <>
            <ScreenTitle
              icon={
                <SlidersHorizontal
                  color={colors.primary}
                  size={25}
                  strokeWidth={2.3}
                />
              }
              title="Explore"
              subtitle="Search small events, recurring circles, and workshops."
            />
            <View style={styles.searchBox}>
              <Search color={colors.muted} size={20} strokeWidth={2.3} />
              <TextInput
                onChangeText={setQuery}
                placeholder="Search by activity or area"
                placeholderTextColor={colors.muted}
                selectionColor={colors.primary}
                style={styles.searchInput}
                value={query}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroller}
            >
              {filters.map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterChip,
                    activeFilter === filter && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === filter && styles.filterTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {exploreResults.length ? (
              <VerticalCards
                items={exploreResults}
                onJoin={requestJoin}
                onOpen={setSelectedItem}
              />
            ) : (
              <EmptyState
                icon={
                  <Search color={colors.info} size={26} strokeWidth={2.3} />
                }
                title="Nothing found"
                text="Try a broader activity, interest, or neighborhood."
              />
            )}
          </>
        );
      case 'circles':
        return (
          <>
            <ScreenTitle
              icon={
                <UsersRound
                  color={colors.secondary}
                  size={26}
                  strokeWidth={2.3}
                />
              }
              title="Circles"
              subtitle="Recurring groups with the same members over several weeks."
            />
            <VerticalCards
              items={visibleCircles}
              onJoin={requestJoin}
              onOpen={setSelectedItem}
            />
          </>
        );
      case 'messages':
        return (
          <>
            <ScreenTitle
              icon={
                <MessageCircle
                  color={colors.info}
                  size={26}
                  strokeWidth={2.3}
                />
              }
              title="Messages"
              subtitle="Cohort chats open after basic verification and joining a group."
            />
            {verified && joinedItems.length ? (
              <View style={styles.verticalCards}>
                {joinedItems.map((item) => (
                  <View key={item.id} style={styles.chatRow}>
                    <MessageCircle
                      color={colors.info}
                      size={22}
                      strokeWidth={2.3}
                    />
                    <View style={styles.chatCopy}>
                      <Text style={styles.chatTitle}>{item.title}</Text>
                      <Text style={styles.chatText}>
                        Event and circle chats only. No random DMs.
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon={
                  <LockKeyhole
                    color={colors.info}
                    size={26}
                    strokeWidth={2.3}
                  />
                }
                title={verified ? 'No cohort chats yet' : 'Chats are locked'}
                text={
                  verified
                    ? 'Join your first circle to start a private group chat.'
                    : 'Complete verification to message cohorts.'
                }
              />
            )}
          </>
        );
      case 'profile':
        return (
          <>
            <ScreenTitle
              icon={
                <CircleUserRound
                  color={colors.primary}
                  size={26}
                  strokeWidth={2.3}
                />
              }
              title={user.displayName}
              subtitle={`@${user.username} · ${user.city}`}
            />
            <View style={styles.profilePanel}>
              <Text style={styles.profileLabel}>About</Text>
              <Text style={styles.profileText}>
                {user.bio ||
                  'Ready to meet women through recurring activities.'}
              </Text>
              <Text style={styles.profileTextMuted}>
                {[user.ageRange, user.occupation, user.languages.join(', ')]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <View style={styles.profileMetaGrid}>
                <ProfileMetric
                  label="Trust score"
                  value={`${user.trustScore}`}
                />
                <ProfileMetric
                  label="Tier"
                  value={formatTrustTier(user.trustTier)}
                />
                <ProfileMetric
                  label="Verification"
                  value={verified ? 'Approved' : 'Pending'}
                />
              </View>
              <View style={styles.profileInterests}>
                {user.interests.map((interest) => (
                  <Text key={interest} style={styles.profileInterest}>
                    {interest}
                  </Text>
                ))}
              </View>
            </View>
            <Section title="My events">
              {joinedItems.length ? (
                <MyActivityCards
                  items={joinedItems}
                  onOpen={setSelectedItem}
                  onFeedback={setFeedbackCandidate}
                />
              ) : (
                <EmptyState
                  icon={
                    <CalendarCheck
                      color={colors.info}
                      size={26}
                      strokeWidth={2.3}
                    />
                  }
                  title="No joined activities yet"
                  text="Join an event or circle to see it here."
                />
              )}
            </Section>
            <View style={styles.profileActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSettingsVisible(true)}
                style={styles.secondaryAction}
              >
                <Settings color={colors.ink} size={19} strokeWidth={2.4} />
                <Text style={styles.secondaryActionText}>Settings</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setHostToolsVisible(true)}
                style={styles.secondaryAction}
              >
                <UserPlus color={colors.muted} size={19} strokeWidth={2.4} />
                <Text style={styles.secondaryActionText}>Create event</Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onLogout}
              style={styles.logoutButton}
            >
              <LogOut color={colors.primaryDark} size={19} strokeWidth={2.4} />
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {joinRequest ? (
        <View style={styles.toast}>
          <CheckCircle2 color={colors.success} size={20} strokeWidth={2.5} />
          <Text style={styles.toastText}>
            Join request sent for {joinRequest}
          </Text>
          <Pressable onPress={() => setJoinRequest(undefined)}>
            <Text style={styles.toastDismiss}>OK</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <Pressable
              accessibilityRole="button"
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tabButton}
            >
              <View style={active ? styles.tabIconActive : styles.tabIcon}>
                {cloneIcon(tab.icon, active ? colors.surface : colors.muted)}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setBlockedModalVisible(false)}
        transparent
        visible={blockedModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.blockedModal}>
            <View style={styles.modalIcon}>
              <LockKeyhole color={colors.primary} size={30} strokeWidth={2.4} />
            </View>
            <Text style={styles.modalTitle}>
              Complete verification to join events and circles.
            </Text>
            <Text style={styles.modalText}>
              This helps us keep Niva safer for everyone.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setBlockedModalVisible(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ActivityDetailModal
        blocked={blockedHosts.includes(
          selectedItem?.host.replace('Hosted by ', '').replace('Led by ', '') ??
            '',
        )}
        item={selectedItem}
        onBlock={blockHost}
        onClose={() => setSelectedItem(undefined)}
        onJoin={requestJoin}
      />

      <FeedbackModal
        idToken={idToken}
        item={feedbackCandidate}
        onSubmitted={loadCommunityData}
        onClose={() => setFeedbackCandidate(undefined)}
      />

      <HostToolsModal
        onClose={() => setHostToolsVisible(false)}
        onCreate={createHostedEvent}
        user={user}
        visible={hostToolsVisible}
      />

      <JoinConfirmModal
        item={joinCandidate}
        onCancel={() => setJoinCandidate(undefined)}
        onConfirm={confirmJoin}
      />

      <SimplePanelModal
        onClose={() => setNotificationsVisible(false)}
        title="Notifications"
        visible={notificationsVisible}
      >
        {notifications.length ? (
          notifications.map((notification) => (
            <PanelRow
              icon={<Bell color={colors.primary} size={22} strokeWidth={2.3} />}
              key={notification.id}
              title={notification.title}
              text={notification.body}
            />
          ))
        ) : (
          <PanelRow
            icon={
              <CheckCircle2
                color={colors.success}
                size={22}
                strokeWidth={2.3}
              />
            }
            title="No notifications yet"
            text="Join requests, reminders, and review updates will appear here."
          />
        )}
      </SimplePanelModal>

      <SimplePanelModal
        onClose={() => setSettingsVisible(false)}
        title="Settings"
        visible={settingsVisible}
      >
        <PanelRow
          icon={
            <CircleUserRound
              color={colors.primary}
              size={22}
              strokeWidth={2.3}
            />
          }
          title="Edit profile"
          text="Update photo, bio, interests, languages, and city."
        />
        <PanelRow
          icon={<Bell color={colors.info} size={22} strokeWidth={2.3} />}
          title="Notifications"
          text="Verification, join requests, reminders, and host updates."
        />
        <PanelRow
          icon={<Ban color={colors.warning} size={22} strokeWidth={2.3} />}
          title="Blocked users"
          text={
            blockedHosts.length
              ? `${blockedHosts.join(', ')} blocked. Tap activity details to block a host in this prototype.`
              : 'No blocked users yet. Blocked users cannot message or appear in recommendations.'
          }
        />
      </SimplePanelModal>
    </View>
  );
}

function Header({
  onOpenNotifications,
  user,
}: {
  onOpenNotifications: () => void;
  user: NivaUser;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>Good morning, {user.displayName}</Text>
        <Text style={styles.city}>{user.city}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenNotifications}
        style={styles.headerBadge}
      >
        <Bell color={colors.primary} size={20} strokeWidth={2.4} />
        <Text style={styles.headerBadgeText}>Alerts</Text>
      </Pressable>
    </View>
  );
}

function TrustCard({ user, verified }: { user: NivaUser; verified: boolean }) {
  const statusTitle = verified
    ? "You're verified"
    : user.verificationStatus === 'pending'
      ? 'Verification pending'
      : 'Verify when you join';
  const statusText = verified
    ? 'You can join events, circles, and cohort chats.'
    : user.verificationStatus === 'pending'
      ? 'Selfie review is pending before joins and chat open.'
      : 'Browse freely. Selfie review starts when you request to join.';

  return (
    <View style={styles.trustCard}>
      <View style={styles.trustHeader}>
        <View
          style={verified ? styles.trustIconVerified : styles.trustIconPending}
        >
          {verified ? (
            <CheckCircle2 color={colors.surface} size={25} strokeWidth={2.4} />
          ) : (
            <ShieldCheck color={colors.warning} size={25} strokeWidth={2.4} />
          )}
        </View>
        <View style={styles.trustCopy}>
          <Text style={styles.trustTitle}>{statusTitle}</Text>
          <Text style={styles.trustText}>{statusText}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(Math.max(user.trustScore, 20), 100)}%` },
          ]}
        />
      </View>
      <View style={styles.trustMeta}>
        <Text style={styles.trustMetaText}>Trust score {user.trustScore}</Text>
        <Text style={styles.trustMetaText}>
          {formatTrustTier(user.trustTier)}
        </Text>
      </View>
    </View>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ScreenTitle({
  icon,
  subtitle,
  title,
}: {
  icon: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.screenTitle}>
      <View style={styles.screenTitleIcon}>{icon}</View>
      <View style={styles.screenTitleCopy}>
        <Text style={styles.screenTitleText}>{title}</Text>
        <Text style={styles.screenSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function HorizontalCards({
  items,
  onJoin,
  onOpen,
}: {
  items: DiscoveryItem[];
  onJoin: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horizontalCards}
    >
      {items.map((item) => (
        <DiscoveryCard
          compact
          item={item}
          key={item.id}
          onJoin={onJoin}
          onOpen={onOpen}
        />
      ))}
    </ScrollView>
  );
}

function VerticalCards({
  items,
  onJoin,
  onOpen,
}: {
  items: DiscoveryItem[];
  onJoin: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
}) {
  return (
    <View style={styles.verticalCards}>
      {items.map((item) => (
        <DiscoveryCard
          item={item}
          key={item.id}
          onJoin={onJoin}
          onOpen={onOpen}
        />
      ))}
    </View>
  );
}

function MyActivityCards({
  items,
  onFeedback,
  onOpen,
}: {
  items: DiscoveryItem[];
  onFeedback: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
}) {
  return (
    <View style={styles.verticalCards}>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Pressable accessibilityRole="button" onPress={() => onOpen(item)}>
            <Text style={styles.category}>{formatCategory(item.category)}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSummary}>{item.time}</Text>
          </Pressable>
          <View style={styles.cardFooter}>
            <Text style={styles.host}>Requested</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onFeedback(item)}
              style={styles.joinButton}
            >
              <Text style={styles.joinButtonText}>Feedback</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function DiscoveryCard({
  compact = false,
  item,
  onJoin,
  onOpen,
}: {
  compact?: boolean;
  item: DiscoveryItem;
  onJoin: (item: DiscoveryItem) => void;
  onOpen: (item: DiscoveryItem) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(item)}
      style={[styles.card, compact && styles.compactCard]}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.category}>{formatCategory(item.category)}</Text>
        {item.seats ? (
          <Text style={styles.seats}>{item.seats} seats</Text>
        ) : null}
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSummary}>{item.summary}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText}>{item.location}</Text>
        <Text style={styles.cardMetaText}>{item.time}</Text>
        {item.duration ? (
          <Text style={styles.cardMetaText}>{item.duration}</Text>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.host}>{item.host}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onJoin(item)}
          style={styles.joinButton}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function ActivityDetailModal({
  blocked,
  item,
  onBlock,
  onClose,
  onJoin,
}: {
  blocked: boolean;
  item?: DiscoveryItem;
  onBlock: (item: DiscoveryItem) => Promise<void>;
  onClose: () => void;
  onJoin: (item: DiscoveryItem) => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.sheetBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.category}>
                {formatCategory(item.category)}
              </Text>
              <Text style={styles.detailTitle}>{item.title}</Text>
            </View>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.detailSummary}>{item.summary}</Text>
          <View style={styles.detailMetaGrid}>
            <ProfileMetric label="Where" value={item.location} />
            <ProfileMetric label="When" value={item.time} />
            <ProfileMetric label="Seats" value={`${item.seats ?? 0}`} />
          </View>
          <Text style={styles.subsectionTitle}>People you'll meet</Text>
          <View style={styles.icebreakerList}>
            {[
              ['Aditi', 'Runs 5Ks', 'Loves coffee'],
              ['Meera', 'Reads fiction', 'New to Bangalore'],
              ['Kavya', 'Badminton beginner', 'Likes painting'],
            ].map(([name, first, second]) => (
              <View key={name} style={styles.icebreakerCard}>
                <Text style={styles.icebreakerName}>{name}</Text>
                <Text style={styles.icebreakerText}>{first}</Text>
                <Text style={styles.icebreakerText}>{second}</Text>
              </View>
            ))}
          </View>
          <View style={styles.safetyActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onBlock(item)}
              style={styles.safetyButton}
            >
              <Ban color={colors.warning} size={17} strokeWidth={2.4} />
              <Text style={styles.safetyButtonText}>
                {blocked ? 'Blocked' : 'Block host'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose();
              onJoin(item);
            }}
            style={styles.modalButton}
          >
            <Text style={styles.modalButtonText}>Request to join</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function JoinConfirmModal({
  item,
  onCancel,
  onConfirm,
}: {
  item?: DiscoveryItem;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <View style={styles.modalBackdrop}>
        <View style={styles.blockedModal}>
          <View style={styles.modalIcon}>
            <Star color={colors.accent} size={30} strokeWidth={2.4} />
          </View>
          <Text style={styles.modalTitle}>Request to join {item.title}?</Text>
          <Text style={styles.modalText}>
            Hosts review join requests so each event and circle stays small and
            safe.
          </Text>
          <View style={styles.confirmButtons}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>Request</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FeedbackModal({
  idToken,
  item,
  onClose,
  onSubmitted,
}: {
  idToken: string;
  item?: DiscoveryItem;
  onClose: () => void;
  onSubmitted: () => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string>();

  if (!item) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.sheetBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.category}>Post-event feedback</Text>
              <Text style={styles.detailTitle}>{item.title}</Text>
            </View>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.detailSummary}>
            Capture the beta signal: attendance quality, safety, and whether the
            group should continue.
          </Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                accessibilityRole="button"
                key={value}
                onPress={() => setRating(value)}
                style={[
                  styles.ratingButton,
                  rating === value && styles.ratingButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.ratingText,
                    rating === value && styles.ratingTextActive,
                  ]}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            multiline
            onChangeText={(value) => {
              setBody(value);
              setError(undefined);
            }}
            placeholder="What worked? What should improve?"
            placeholderTextColor={colors.muted}
            style={styles.feedbackInput}
            value={body}
          />
          {error ? <Text style={styles.formError}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              try {
                if (item.category === 'event') {
                  await submitEventFeedback(idToken, item.remoteId ?? item.id, {
                    body,
                    rating,
                  });
                  await onSubmitted();
                }

                onClose();
              } catch (submitError) {
                setError(
                  submitError instanceof Error
                    ? submitError.message
                    : 'Unable to submit feedback.',
                );
              }
            }}
            style={styles.modalButton}
          >
            <Text style={styles.modalButtonText}>Submit feedback</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function HostToolsModal({
  onClose,
  onCreate,
  user,
  visible,
}: {
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  user: NivaUser;
  visible: boolean;
}) {
  const [title, setTitle] = useState('');
  const canHost =
    user.trustTier === 'trusted' ||
    user.trustTier === 'host_eligible' ||
    user.trustTier === 'host';

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.sheetBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Create event</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          {canHost ? (
            <>
              <Text style={styles.detailSummary}>
                Draft a small beta event. Published events still need admin
                review before real users can join.
              </Text>
              <TextInput
                onChangeText={setTitle}
                placeholder="Sunday pottery table"
                placeholderTextColor={colors.muted}
                style={styles.hostInput}
                value={title}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => onCreate(title)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Create draft</Text>
              </Pressable>
            </>
          ) : (
            <EmptyState
              icon={
                <LockKeyhole color={colors.info} size={26} strokeWidth={2.3} />
              }
              title="Host tools are locked"
              text="Create Event opens for trusted members and manually approved hosts."
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function SimplePanelModal({
  children,
  onClose,
  title,
  visible,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.sheetBackdrop}>
        <View style={styles.detailSheet}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <View style={styles.panelList}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

function PanelRow({
  icon,
  text,
  title,
}: {
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <View style={styles.panelRow}>
      <View style={styles.panelIcon}>{icon}</View>
      <View style={styles.panelCopy}>
        <Text style={styles.panelTitle}>{title}</Text>
        <Text style={styles.panelText}>{text}</Text>
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  text,
  title,
}: {
  icon: ReactNode;
  text: string;
  title: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function cloneIcon(icon: ReactNode, color: string) {
  if (!isValidElement<{ color?: string; strokeWidth?: number }>(icon)) {
    return icon;
  }

  return cloneElement(icon, {
    color,
    strokeWidth: 2.4,
  });
}

function formatCategory(category: DiscoveryItem['category']) {
  switch (category) {
    case 'circle':
      return 'Circle';
    case 'event':
      return 'Event';
    case 'tip':
      return 'Tip';
    case 'workshop':
      return 'Workshop';
  }
}

function formatTrustTier(tier: NivaUser['trustTier']) {
  switch (tier) {
    case 'basic_verified':
      return 'Basic verified';
    case 'host':
      return 'Host';
    case 'host_eligible':
      return 'Host eligible';
    case 'new':
      return 'New';
    case 'trusted':
      return 'Trusted';
  }
}

function activityToDiscoveryItem(
  activity: CommunityActivity,
  category: 'circle' | 'event',
): DiscoveryItem {
  const startsAt = new Date(activity.startsAt);
  const availableSeats = Math.max(
    activity.capacity - (activity._count?.members ?? 0),
    0,
  );
  const hostName =
    activity.host?.displayName ?? activity.host?.username ?? 'Niva';

  return {
    id: activity.id,
    remoteId: activity.id,
    hostId: activity.host?.id,
    category,
    title: activity.title,
    location: activity.locationName,
    time:
      category === 'circle' && activity.schedule
        ? activity.schedule
        : startsAt.toLocaleString(undefined, {
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            month: 'short',
          }),
    seats: availableSeats,
    duration: activity.durationWeeks
      ? `${activity.durationWeeks} weeks`
      : undefined,
    difficulty: formatActivityDifficulty(activity.difficulty),
    interests: activity.interests,
    host:
      category === 'circle' ? `Led by ${hostName}` : `Hosted by ${hostName}`,
    summary: activity.description,
  };
}

function formatActivityDifficulty(
  difficulty: string,
): DiscoveryItem['difficulty'] {
  switch (difficulty) {
    case 'BEGINNER':
      return 'Beginner';
    case 'EASY':
      return 'Easy';
    case 'FOCUSED':
      return 'Focused';
    default:
      return 'Social';
  }
}

const styles = StyleSheet.create({
  apiBanner: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.warning,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  apiBannerText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  blockedModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cardMeta: {
    gap: 3,
  },
  cardMetaText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardSummary: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    lineHeight: 25,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButtonText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  category: {
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  chatCopy: {
    flex: 1,
    gap: 3,
  },
  chatRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  chatText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  chatTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  city: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: 3,
  },
  compactCard: {
    marginRight: spacing.md,
    width: 260,
  },
  closeText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 116,
  },
  detailHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  detailMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  detailSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '86%',
    padding: spacing.lg,
  },
  detailSummary: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  detailTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    lineHeight: 26,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterScroller: {
    marginBottom: spacing.lg,
  },
  filterText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  filterTextActive: {
    color: colors.surface,
  },
  formError: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: spacing.md,
  },
  feedbackInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: spacing.lg,
    minHeight: 112,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  greeting: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerBadgeText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  horizontalCards: {
    marginRight: -spacing.lg,
  },
  icebreakerCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    flex: 1,
    minWidth: 128,
    padding: spacing.md,
  },
  icebreakerList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icebreakerName: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  icebreakerText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  host: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
  },
  hostInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: typography.body,
    marginTop: spacing.lg,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  joinButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinButtonText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '800',
    textAlign: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '800',
  },
  metric: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    flex: 1,
    minWidth: 96,
    padding: spacing.md,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 18,
  },
  metricValue: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(33, 26, 29, 0.36)',
    flex: 1,
    justifyContent: 'center',
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 48,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  modalButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: '800',
  },
  modalIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 58,
  },
  modalText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    lineHeight: 26,
  },
  panelCopy: {
    flex: 1,
    gap: 3,
  },
  panelIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  panelList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  panelRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  panelText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  panelTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  profileActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  profileInterest: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    color: colors.secondary,
    fontSize: typography.small,
    fontWeight: '800',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  profileInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  profileLabel: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  profileMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  profilePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  profileText: {
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 24,
  },
  profileTextMuted: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  progressFill: {
    backgroundColor: colors.secondary,
    borderRadius: radius.pill,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 9,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  ratingButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  ratingButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  ratingText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  ratingTextActive: {
    color: colors.surface,
  },
  screenSubtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.xs,
  },
  screenTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  screenTitleCopy: {
    flex: 1,
  },
  screenTitleIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  screenTitleText: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '800',
    lineHeight: 34,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    minHeight: 54,
  },
  safetyActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  safetyButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  safetyButtonText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  seats: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  secondaryActionText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(33, 26, 29, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  subsectionTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  tabBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    minHeight: 78,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minHeight: 56,
    justifyContent: 'center',
  },
  tabIcon: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  tabIconActive: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  tabLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tipList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  tipRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  toast: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    bottom: 92,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.md,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.md,
  },
  toastDismiss: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  toastText: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 18,
  },
  trustCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  trustCopy: {
    flex: 1,
    gap: 3,
  },
  trustHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  trustIconPending: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  trustIconVerified: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  trustMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  trustMetaText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  trustText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  trustTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  verticalCards: {
    gap: spacing.md,
  },
});
