import {
  Bell,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  CircleUserRound,
  Compass,
  Home,
  LockKeyhole,
  LogOut,
  Pencil,
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

import { DiscoveryItem, safetyTips } from '../data/discovery';
import { colors, radius, spacing, typography } from '../constants/theme';
import { ActivityDetailScreen } from './ActivityDetailScreen';
import { ChatScreen } from './ChatScreen';
import { CommunityGuidelinesScreen } from './CommunityGuidelinesScreen';
import { CreateCircleInput, CreateCircleScreen } from './CreateCircleScreen';
import { CreateEventInput, CreateEventScreen } from './CreateEventScreen';
import { ActivityEditInput, EditActivityScreen } from './EditActivityScreen';
import { EventFeedbackScreen } from './EventFeedbackScreen';
import { IcebreakersScreen } from './IcebreakersScreen';
import { ManageCircleScreen } from './ManageCircleScreen';
import { MyActivitiesScreen } from './MyActivitiesScreen';
import { ManageEventScreen } from './ManageEventScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { SettingsScreen } from './SettingsScreen';
import { acceptCommunityGuidelines } from '../services/session';
import {
  blockUser,
  BlockedUser,
  cancelCircle,
  cancelEvent,
  CommunityActivity,
  CommunitySettings,
  createCircle as createCommunityCircle,
  createEvent as createCommunityEvent,
  getHostApproval,
  getSettings,
  HostApproval,
  joinCircle,
  joinEvent,
  leaveCircle,
  leaveEvent,
  listBlocks,
  listCircles,
  listEvents,
  listRecommendations,
  listMyActivities,
  listNotifications,
  markNotificationRead,
  NotificationItem,
  requestHostApproval,
  submitEventFeedback,
  unblockUser,
  updateCircle,
  updateEvent,
  updateContinuityPreference,
  updateSettings,
} from '../services/community';
import {
  disconnectRealtime,
  subscribeToMemberRealtime,
} from '../services/realtime';
import {
  registerForPushNotifications,
  subscribeToPushNotificationResponses,
} from '../services/push-notifications';
import { NivaUser } from '../types/niva';

type HomeScreenProps = {
  idToken: string;
  initialTab?: 'home' | 'profile';
  user: NivaUser;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  onEditProfile: () => void;
  onStartVerification: (joiningTitle?: string) => void;
};

type Tab = 'home' | 'explore' | 'plans' | 'profile';
type SecondaryScreen =
  'create-circle' | 'create-event' | 'notifications' | 'settings';

const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
  { id: 'home', label: 'Home', icon: <Home size={21} /> },
  { id: 'explore', label: 'Explore', icon: <Search size={21} /> },
  { id: 'plans', label: 'Plans', icon: <CalendarCheck size={21} /> },
  { id: 'profile', label: 'Profile', icon: <CircleUserRound size={21} /> },
];

const filters = ['All', 'Fitness', 'Books', 'Wellness', 'Career', 'Safety'];
const exploreKinds = [
  { id: 'all', label: 'All' },
  { id: 'event', label: 'Events' },
  { id: 'circle', label: 'Circles' },
] as const;
type ExploreKind = (typeof exploreKinds)[number]['id'];
const defaultSettings: CommunitySettings = {
  allowCircleContinuitySuggestions: true,
  notificationsEnabled: true,
  showInterestsInIcebreakers: true,
  showProfileInRecommendations: true,
};

export function HomeScreen({
  idToken,
  initialTab = 'home',
  user,
  onLogout,
  onDeleteAccount,
  onEditProfile,
  onStartVerification,
}: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [blockedModalVisible, setBlockedModalVisible] = useState(false);
  const [joinRequest, setJoinRequest] = useState<string>();
  const [joinCandidate, setJoinCandidate] = useState<DiscoveryItem>();
  const [guidelinesJoin, setGuidelinesJoin] = useState<DiscoveryItem>();
  const [chatItem, setChatItem] = useState<DiscoveryItem>();
  const [icebreakerActivity, setIcebreakerActivity] = useState<DiscoveryItem>();
  const [managedEvent, setManagedEvent] = useState<DiscoveryItem>();
  const [managedCircle, setManagedCircle] = useState<DiscoveryItem>();
  const [feedbackEvent, setFeedbackEvent] = useState<DiscoveryItem>();
  const [editingActivity, setEditingActivity] = useState<DiscoveryItem>();
  const [selectedItem, setSelectedItem] = useState<DiscoveryItem>();
  const [blockedHosts, setBlockedHosts] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [apiEvents, setApiEvents] = useState<DiscoveryItem[]>([]);
  const [apiCircles, setApiCircles] = useState<DiscoveryItem[]>([]);
  const [apiRecommendations, setApiRecommendations] = useState<DiscoveryItem[]>(
    [],
  );
  const [myActivities, setMyActivities] = useState<DiscoveryItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<CommunitySettings>();
  const [hostApproval, setHostApproval] = useState<HostApproval | null>();
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(
    user.communityGuidelinesAccepted,
  );
  const [apiError, setApiError] = useState<string>();
  const [secondaryScreen, setSecondaryScreen] = useState<SecondaryScreen>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [activeExploreKind, setActiveExploreKind] =
    useState<ExploreKind>('all');
  const verified = user.verificationStatus === 'approved';
  const allItems = useMemo(
    () => [...apiEvents, ...apiCircles],
    [apiCircles, apiEvents],
  );
  const recommended = apiRecommendations;
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
      const matchesKind =
        activeExploreKind === 'all' || item.category === activeExploreKind;

      return matchesQuery && matchesFilter && matchesKind;
    });
  }, [activeExploreKind, activeFilter, allItems, query]);
  const nextPlan = useMemo(
    () =>
      myActivities
        .filter(
          (item) =>
            item.membershipStatus === 'APPROVED' &&
            (!item.startsAt || new Date(item.startsAt).getTime() >= Date.now()),
        )
        .sort((left, right) =>
          (left.startsAt ?? '').localeCompare(right.startsAt ?? ''),
        )[0],
    [myActivities],
  );

  useEffect(() => {
    void loadCommunityData();
  }, [idToken, user.city]);

  useEffect(() => {
    if (!settings?.notificationsEnabled) {
      return;
    }

    void registerForPushNotifications(idToken).catch((error) => {
      console.warn(
        'Unable to register this device for push notifications.',
        error,
      );
    });
  }, [idToken, settings?.notificationsEnabled]);

  useEffect(
    () =>
      subscribeToPushNotificationResponses(() => {
        setSecondaryScreen('notifications');
        void loadCommunityData();
      }),
    [idToken],
  );

  const loadCommunityData = async () => {
    try {
      setApiError(undefined);
      const [
        eventsPayload,
        circlesPayload,
        activitiesPayload,
        notificationsPayload,
        settingsPayload,
        blocksPayload,
        hostApprovalPayload,
        recommendationsPayload,
      ] = await Promise.all([
        listEvents(idToken, user.city),
        listCircles(idToken, user.city),
        listMyActivities(idToken),
        listNotifications(idToken),
        getSettings(idToken),
        listBlocks(idToken),
        getHostApproval(idToken),
        listRecommendations(idToken),
      ]);

      const events = eventsPayload.events.map((event) =>
        activityToDiscoveryItem(event, 'event'),
      );
      const circles = circlesPayload.circles.map((circle) =>
        activityToDiscoveryItem(circle, 'circle'),
      );
      const memberships: DiscoveryItem[] = [
        ...activitiesPayload.events.flatMap((membership) =>
          membership.event
            ? [
                {
                  ...activityToDiscoveryItem(membership.event, 'event'),
                  membershipStatus: membership.status,
                },
              ]
            : [],
        ),
        ...activitiesPayload.circles.flatMap((membership) =>
          membership.circle
            ? [
                {
                  ...activityToDiscoveryItem(membership.circle, 'circle'),
                  membershipStatus: membership.status,
                },
              ]
            : [],
        ),
      ];
      const recommendations = recommendationsPayload.recommendations.flatMap(
        (activity) =>
          activity.category === 'circle' || activity.category === 'event'
            ? [activityToDiscoveryItem(activity, activity.category)]
            : [],
      );

      setApiEvents(events);
      setApiCircles(circles);
      setApiRecommendations(recommendations);
      setMyActivities(memberships);
      setNotifications(notificationsPayload.notifications);
      setSettings(settingsPayload.settings);
      setBlockedUsers(blocksPayload.blocks);
      setHostApproval(hostApprovalPayload.approval);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to load live Niva data.',
      );
    }
  };

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeToMemberRealtime(idToken, () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => void loadCommunityData(), 250);
    });

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      unsubscribe();
      disconnectRealtime();
    };
  }, [idToken, user.city]);

  const requestJoin = (item: DiscoveryItem) => {
    if (!item.remoteId) {
      setApiError(
        'This activity is not published yet. Join requests open only for live Niva activities.',
      );
      return;
    }

    if (item.seats === 0) {
      setApiError(
        'This activity is full. Please choose another nearby gathering.',
      );
      return;
    }

    if (!verified) {
      if (user.verificationStatus === 'not_started') {
        onStartVerification(item.title);
        return;
      }

      setBlockedModalVisible(true);
      return;
    }

    if (!guidelinesAccepted) {
      setGuidelinesJoin(item);
      return;
    }

    setJoinCandidate(item);
  };

  const acceptGuidelinesForJoin = async () => {
    const pendingItem = guidelinesJoin;
    if (!pendingItem) {
      return;
    }

    try {
      await acceptCommunityGuidelines(idToken);
      setGuidelinesAccepted(true);
      setGuidelinesJoin(undefined);
      setJoinCandidate(pendingItem);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to save your community agreement.',
      );
    }
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

      setJoinRequest(joinCandidate.title);
      setJoinCandidate(undefined);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to send join request.',
      );
    }
  };

  const createHostedEvent = async (input: CreateEventInput) => {
    try {
      await createCommunityEvent(idToken, {
        capacity: input.capacity,
        city: input.city,
        description: input.description,
        difficulty: input.difficulty,
        interests: input.interests,
        latitude: input.latitude,
        locationName: input.locationName,
        longitude: input.longitude,
        startsAt: input.startsAt,
        title: input.title,
      });

      setSecondaryScreen(undefined);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to create event.',
      );
    }
  };

  const createHostedCircle = async (input: CreateCircleInput) => {
    try {
      await createCommunityCircle(idToken, {
        capacity: input.capacity,
        city: input.city,
        description: input.description,
        difficulty: input.difficulty,
        durationWeeks: input.durationWeeks,
        interests: input.interests,
        latitude: input.latitude,
        locationName: input.locationName,
        longitude: input.longitude,
        schedule: input.schedule,
        startsAt: input.startsAt,
        title: input.title,
      });
      setSecondaryScreen(undefined);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to create circle.',
      );
    }
  };

  const submitFeedback = async (input: {
    body?: string;
    continuity?: {
      wantsCircleSuggestions: boolean;
      wantsSimilarEvents: boolean;
    };
    rating: number;
  }) => {
    if (!feedbackEvent) {
      return;
    }

    try {
      await submitEventFeedback(
        idToken,
        feedbackEvent.remoteId ?? feedbackEvent.id,
        { body: input.body, rating: input.rating },
      );
      if (input.continuity) {
        await updateContinuityPreference(
          idToken,
          feedbackEvent.remoteId ?? feedbackEvent.id,
          input.continuity,
        );
      }
      setFeedbackEvent(undefined);
      setApiError(
        input.continuity
          ? 'Thank you. Your feedback and continuity preferences have been saved.'
          : 'Thank you. Your feedback has been saved.',
      );
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to save feedback.',
      );
    }
  };

  const updateHostedActivity = async (input: ActivityEditInput) => {
    if (!editingActivity) {
      return;
    }

    const activityId = editingActivity.remoteId ?? editingActivity.id;
    if (editingActivity.category === 'circle') {
      await updateCircle(idToken, activityId, {
        capacity: input.capacity,
        city: input.city,
        description: input.description,
        difficulty: input.difficulty,
        durationWeeks: input.durationWeeks,
        interests: input.interests,
        latitude: input.latitude,
        locationName: input.locationName,
        longitude: input.longitude,
        schedule: input.schedule,
        startsAt: input.startsAt,
        title: input.title,
      });
    } else {
      await updateEvent(idToken, activityId, {
        capacity: input.capacity,
        city: input.city,
        description: input.description,
        difficulty: input.difficulty,
        interests: input.interests,
        latitude: input.latitude,
        locationName: input.locationName,
        longitude: input.longitude,
        startsAt: input.startsAt,
        title: input.title,
      });
    }

    setEditingActivity(undefined);
    setSelectedItem(undefined);
    setApiError('Activity details updated. Affected members were notified.');
    await loadCommunityData();
  };

  const cancelHostedActivity = async (reason: string) => {
    if (!editingActivity) {
      return;
    }

    const activityId = editingActivity.remoteId ?? editingActivity.id;
    if (editingActivity.category === 'circle') {
      await cancelCircle(idToken, activityId, reason);
    } else {
      await cancelEvent(idToken, activityId, reason);
    }

    setEditingActivity(undefined);
    setSelectedItem(undefined);
    setApiError('Activity cancelled. Affected members were notified.');
    await loadCommunityData();
  };

  const requestHostAccess = async () => {
    try {
      const payload = await requestHostApproval(idToken);
      setHostApproval(payload.approval);
      setApiError(undefined);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to request host access.',
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
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to block this host.',
      );
    }
  };

  const leaveActivity = async (item: DiscoveryItem) => {
    try {
      if (item.category === 'circle') {
        await leaveCircle(idToken, item.remoteId ?? item.id);
      } else if (item.category === 'event') {
        await leaveEvent(idToken, item.remoteId ?? item.id);
      }

      setSelectedItem(undefined);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to leave this activity.',
      );
    }
  };

  const updateMemberSettings = async (nextSettings: CommunitySettings) => {
    try {
      const payload = await updateSettings(idToken, nextSettings);
      setSettings(payload.settings);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to update settings.',
      );
    }
  };

  const unblockMember = async (blockedUserId: string) => {
    try {
      await unblockUser(idToken, blockedUserId);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to unblock this member.',
      );
    }
  };

  const readNotification = async (notificationId: string) => {
    try {
      const payload = await markNotificationRead(idToken, notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, ...payload.notification }
            : notification,
        ),
      );
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Unable to update this notification.',
      );
    }
  };

  if (selectedItem) {
    const hostName = selectedItem.host
      .replace('Hosted by ', '')
      .replace('Led by ', '');
    const blocked =
      (selectedItem.hostId
        ? blockedUsers.some((item) => item.blockedId === selectedItem.hostId)
        : false) || blockedHosts.includes(hostName);

    return (
      <ActivityDetailScreen
        blocked={blocked}
        isHost={selectedItem.hostId === user.id}
        item={selectedItem}
        onBack={() => setSelectedItem(undefined)}
        onBlock={() => void blockHost(selectedItem)}
        onJoin={() => {
          setSelectedItem(undefined);
          requestJoin(selectedItem);
        }}
        onOpenChat={() => {
          setChatItem(selectedItem);
          setSelectedItem(undefined);
        }}
        onLeave={() => void leaveActivity(selectedItem)}
        onManage={() => {
          if (selectedItem.category === 'circle') {
            setManagedCircle(selectedItem);
          } else {
            setManagedEvent(selectedItem);
          }
          setSelectedItem(undefined);
        }}
        onEdit={() => {
          setEditingActivity(selectedItem);
          setSelectedItem(undefined);
        }}
        onIcebreakers={() => {
          setIcebreakerActivity(selectedItem);
          setSelectedItem(undefined);
        }}
      />
    );
  }

  if (editingActivity) {
    return (
      <EditActivityScreen
        activity={editingActivity}
        onBack={() => setEditingActivity(undefined)}
        onCancel={cancelHostedActivity}
        onSave={updateHostedActivity}
        user={user}
      />
    );
  }

  if (guidelinesJoin) {
    return (
      <CommunityGuidelinesScreen
        activityTitle={guidelinesJoin.title}
        onAccept={() => void acceptGuidelinesForJoin()}
        onBack={() => setGuidelinesJoin(undefined)}
      />
    );
  }

  if (managedEvent) {
    return (
      <ManageEventScreen
        event={managedEvent}
        idToken={idToken}
        onBack={() => setManagedEvent(undefined)}
      />
    );
  }

  if (managedCircle) {
    return (
      <ManageCircleScreen
        circle={managedCircle}
        idToken={idToken}
        onBack={() => setManagedCircle(undefined)}
      />
    );
  }

  if (feedbackEvent) {
    return (
      <EventFeedbackScreen
        event={feedbackEvent}
        canSetContinuity={feedbackEvent.membershipStatus === 'ATTENDED'}
        onBack={() => setFeedbackEvent(undefined)}
        onSubmit={(input) => void submitFeedback(input)}
      />
    );
  }

  if (icebreakerActivity) {
    return (
      <IcebreakersScreen
        activity={icebreakerActivity}
        idToken={idToken}
        onBack={() => setIcebreakerActivity(undefined)}
      />
    );
  }

  if (chatItem) {
    return (
      <ChatScreen
        activity={chatItem}
        idToken={idToken}
        onBack={() => setChatItem(undefined)}
        userId={user.id}
      />
    );
  }

  if (secondaryScreen === 'notifications') {
    return (
      <NotificationsScreen
        notifications={notifications}
        onBack={() => setSecondaryScreen(undefined)}
        onRead={(notificationId) => void readNotification(notificationId)}
      />
    );
  }

  if (secondaryScreen === 'settings') {
    return (
      <SettingsScreen
        blockedUsers={blockedUsers}
        onBack={() => setSecondaryScreen(undefined)}
        onChange={(nextSettings) => void updateMemberSettings(nextSettings)}
        onDeleteAccount={onDeleteAccount}
        onUnblock={(blockedUserId) => void unblockMember(blockedUserId)}
        settings={settings ?? defaultSettings}
      />
    );
  }

  if (secondaryScreen === 'create-event') {
    return (
      <CreateEventScreen
        onBack={() => setSecondaryScreen(undefined)}
        onCreate={createHostedEvent}
        user={user}
      />
    );
  }

  if (secondaryScreen === 'create-circle') {
    return (
      <CreateCircleScreen
        onBack={() => setSecondaryScreen(undefined)}
        onCreate={createHostedCircle}
        user={user}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <Header
              onOpenNotifications={() => setSecondaryScreen('notifications')}
              user={user}
            />
            <TrustCard user={user} verified={verified} />
            {apiError ? (
              <View style={styles.apiBanner}>
                <Text style={styles.apiBannerText}>{apiError}</Text>
              </View>
            ) : null}
            <Section title="Your next plan">
              {nextPlan ? (
                <VerticalCards
                  items={[nextPlan]}
                  onJoin={requestJoin}
                  onOpen={setSelectedItem}
                />
              ) : (
                <EmptyState
                  icon={
                    <CalendarDays
                      color={colors.info}
                      size={26}
                      strokeWidth={2.3}
                    />
                  }
                  title="Nothing scheduled yet"
                  text="Explore an event or recurring circle when you are ready."
                />
              )}
            </Section>
            <Section title="Recommended for you">
              {recommended.length ? (
                <HorizontalCards
                  items={recommended.slice(0, 2)}
                  onJoin={requestJoin}
                  onOpen={setSelectedItem}
                />
              ) : (
                <EmptyState
                  icon={
                    <UsersRound
                      color={colors.info}
                      size={26}
                      strokeWidth={2.3}
                    />
                  }
                  title="Recommendations are warming up"
                  text="Your interests will shape the plans shown here."
                />
              )}
            </Section>
            <Section title={`Discover this week in ${user.city}`}>
              {allItems.length ? (
                <HorizontalCards
                  items={allItems.slice(0, 3)}
                  onJoin={requestJoin}
                  onOpen={setSelectedItem}
                />
              ) : (
                <EmptyState
                  icon={
                    <Compass color={colors.info} size={26} strokeWidth={2.3} />
                  }
                  title="No plans published yet"
                  text="New events and circles will appear here as hosts publish them."
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
            <View style={styles.exploreTypeControl}>
              {exploreKinds.map((kind) => {
                const active = activeExploreKind === kind.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={kind.id}
                    onPress={() => setActiveExploreKind(kind.id)}
                    style={[
                      styles.exploreTypeButton,
                      active && styles.exploreTypeButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.exploreTypeText,
                        active && styles.exploreTypeTextActive,
                      ]}
                    >
                      {kind.label}
                    </Text>
                  </Pressable>
                );
              })}
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
      case 'plans':
        return (
          <MyActivitiesScreen
            embedded
            items={myActivities}
            onChat={setChatItem}
            onFeedback={setFeedbackEvent}
            onLeave={(item) => void leaveActivity(item)}
            onOpen={setSelectedItem}
          />
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
                {[user.age, user.occupation, user.languages.join(', ')]
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
            <View style={styles.profileActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onEditProfile}
                style={styles.secondaryAction}
              >
                <Pencil color={colors.muted} size={19} strokeWidth={2.4} />
                <Text style={styles.secondaryActionText}>Edit profile</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSecondaryScreen('settings')}
                style={styles.secondaryAction}
              >
                <Settings color={colors.muted} size={19} strokeWidth={2.4} />
                <Text style={styles.secondaryActionText}>Settings</Text>
              </Pressable>
              {hostApproval?.status === 'APPROVED' ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSecondaryScreen('create-event')}
                    style={styles.secondaryAction}
                  >
                    <UserPlus
                      color={colors.muted}
                      size={19}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.secondaryActionText}>Create event</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSecondaryScreen('create-circle')}
                    style={styles.secondaryAction}
                  >
                    <UsersRound
                      color={colors.muted}
                      size={19}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.secondaryActionText}>
                      Create circle
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={hostApproval?.status === 'PENDING'}
                  onPress={() => void requestHostAccess()}
                  style={[
                    styles.secondaryAction,
                    hostApproval?.status === 'PENDING' && styles.actionDisabled,
                  ]}
                >
                  <UserPlus color={colors.muted} size={19} strokeWidth={2.4} />
                  <Text style={styles.secondaryActionText}>
                    {hostApproval?.status === 'PENDING'
                      ? 'Host request pending'
                      : hostApproval?.status === 'REJECTED'
                        ? 'Request host access again'
                        : 'Request host access'}
                  </Text>
                </Pressable>
              )}
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

      <JoinConfirmModal
        item={joinCandidate}
        onCancel={() => setJoinCandidate(undefined)}
        onConfirm={confirmJoin}
      />
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
      <View style={styles.headerCopy}>
        <Text numberOfLines={2} style={styles.greeting}>
          Good morning, {user.displayName}
        </Text>
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
          onPress={() => (item.remoteId ? onJoin(item) : onOpen(item))}
          style={styles.joinButton}
        >
          <Text style={styles.joinButtonText}>
            {item.remoteId ? 'Join' : 'Details'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
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
    activityStatus: activity.status,
    cancellationReason: activity.cancellationReason,
    capacity: activity.capacity,
    startsAt: activity.startsAt,
    hostId: activity.host?.id,
    category,
    title: activity.title,
    location: activity.locationName,
    city: activity.city,
    latitude: activity.latitude ?? undefined,
    longitude: activity.longitude ?? undefined,
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
    schedule: activity.schedule,
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
  actionDisabled: {
    opacity: 0.55,
  },
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
  exploreTypeButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  exploreTypeButtonActive: {
    backgroundColor: colors.surface,
  },
  exploreTypeControl: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.xs,
  },
  exploreTypeText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '800',
  },
  exploreTypeTextActive: {
    color: colors.ink,
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
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 0,
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
  myPlansAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  myPlansText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
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
