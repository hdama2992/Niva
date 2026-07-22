import {
  ArrowRight,
  Bell,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Compass,
  Home,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  X,
} from 'lucide-react-native';
import {
  cloneElement,
  isValidElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';

import { DiscoveryItem, safetyTips } from '../data/discovery';
import { hostToolsEnabled } from '../constants/features';
import { colors, radius, spacing, typography } from '../constants/theme';
import {
  activityArtwork as curatedArtwork,
  resolveActivityCardArtwork,
  resolveActivityArtwork,
} from '../constants/activity-artwork';
import { ActivityDetailScreen } from './ActivityDetailScreen';
import { ChatScreen } from './ChatScreen';
import { CreateCircleInput, CreateCircleScreen } from './CreateCircleScreen';
import { CreateEventInput, CreateEventScreen } from './CreateEventScreen';
import { ActivityEditInput, EditActivityScreen } from './EditActivityScreen';
import { EventFeedbackScreen } from './EventFeedbackScreen';
import { IcebreakersScreen } from './IcebreakersScreen';
import { ManageCircleScreen } from './ManageCircleScreen';
import { MyActivitiesScreen } from './MyActivitiesScreen';
import { ManageEventScreen } from './ManageEventScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { HostPathwayScreen } from './HostPathwayScreen';
import { ReportReason, ReportScreen } from './ReportScreen';
import { SettingsScreen } from './SettingsScreen';
import { uploadActivityCover } from '../services/media';
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
  listIcebreakers,
  listRecommendations,
  listMyActivities,
  listNotifications,
  markNotificationRead,
  NotificationItem,
  IcebreakerMember,
  reportUser,
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
  initialTab?: Tab;
  user: NivaUser;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  onEditProfile: () => void;
  onStartVerification: (joiningTitle?: string, returnTab?: Tab) => void;
};

type Tab = 'home' | 'explore' | 'plans' | 'chats' | 'profile';
type SecondaryScreen =
  | 'create-circle'
  | 'create-event'
  | 'host-pathway'
  | 'notifications'
  | 'settings';

const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
  { id: 'home', label: 'Home', icon: <Home size={21} /> },
  { id: 'explore', label: 'Explore', icon: <Search size={21} /> },
  { id: 'plans', label: 'Plans', icon: <CalendarCheck size={21} /> },
  { id: 'chats', label: 'Chats', icon: <MessageCircle size={21} /> },
  { id: 'profile', label: 'Profile', icon: <CircleUserRound size={21} /> },
];
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
  const [chatItem, setChatItem] = useState<DiscoveryItem>();
  const [icebreakerActivity, setIcebreakerActivity] = useState<DiscoveryItem>();
  const [managedEvent, setManagedEvent] = useState<DiscoveryItem>();
  const [managedCircle, setManagedCircle] = useState<DiscoveryItem>();
  const [feedbackEvent, setFeedbackEvent] = useState<DiscoveryItem>();
  const [editingActivity, setEditingActivity] = useState<DiscoveryItem>();
  const [selectedItem, setSelectedItem] = useState<DiscoveryItem>();
  const [detailMembers, setDetailMembers] = useState<IcebreakerMember[]>([]);
  const [nextPlanMembers, setNextPlanMembers] = useState<IcebreakerMember[]>(
    [],
  );
  const [reportItem, setReportItem] = useState<DiscoveryItem>();
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
  const [apiError, setApiError] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [secondaryScreen, setSecondaryScreen] = useState<SecondaryScreen>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (joinCandidate) setJoinCandidate(undefined);
        else if (reportItem) setReportItem(undefined);
        else if (editingActivity) setEditingActivity(undefined);
        else if (feedbackEvent) setFeedbackEvent(undefined);
        else if (managedCircle) setManagedCircle(undefined);
        else if (managedEvent) setManagedEvent(undefined);
        else if (icebreakerActivity) setIcebreakerActivity(undefined);
        else if (chatItem) setChatItem(undefined);
        else if (selectedItem) setSelectedItem(undefined);
        else if (secondaryScreen) setSecondaryScreen(undefined);
        else if (activeTab !== 'home') setActiveTab('home');
        else return false;
        return true;
      },
    );

    return () => subscription.remove();
  }, [
    activeTab,
    chatItem,
    editingActivity,
    feedbackEvent,
    icebreakerActivity,
    joinCandidate,
    managedCircle,
    managedEvent,
    reportItem,
    secondaryScreen,
    selectedItem,
  ]);
  const verified = user.verificationStatus === 'approved';
  const allItems = useMemo(
    () => [...apiEvents, ...apiCircles],
    [apiCircles, apiEvents],
  );
  const recommended = apiRecommendations;
  const availableFilters = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(allItems.flatMap((item) => item.interests).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [allItems],
  );
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

  useEffect(() => {
    if (!availableFilters.includes(activeFilter)) {
      setActiveFilter('All');
    }
  }, [activeFilter, availableFilters]);
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
  const homeRecommendations = useMemo(() => {
    const source = recommended.length ? recommended : allItems;
    const nextPlanId = nextPlan?.remoteId ?? nextPlan?.id;
    const seen = new Set<string>();

    return source
      .filter((item) => {
        const id = item.remoteId ?? item.id;
        if (id === nextPlanId || seen.has(id)) {
          return false;
        }
        seen.add(id);
        return true;
      })
      .slice(0, 5);
  }, [allItems, nextPlan, recommended]);

  useEffect(() => {
    void loadCommunityData();
  }, [idToken, user.city]);

  useEffect(
    () =>
      subscribeToPushNotificationResponses(() => {
        setSecondaryScreen('notifications');
        void loadCommunityData();
      }),
    [idToken],
  );

  useEffect(() => {
    let active = true;
    setDetailMembers([]);

    if (
      !selectedItem?.remoteId ||
      (selectedItem.category !== 'event' &&
        selectedItem.category !== 'circle') ||
      (selectedItem.membershipStatus !== 'APPROVED' &&
        selectedItem.membershipStatus !== 'ATTENDED')
    ) {
      return () => {
        active = false;
      };
    }

    void listIcebreakers(
      idToken,
      selectedItem.category === 'circle' ? 'CIRCLE' : 'EVENT',
      selectedItem.remoteId,
    )
      .then((payload) => {
        if (active) {
          setDetailMembers(payload.members);
        }
      })
      .catch(() => {
        if (active) {
          setDetailMembers([]);
        }
      });

    return () => {
      active = false;
    };
  }, [idToken, selectedItem]);

  useEffect(() => {
    let active = true;
    setNextPlanMembers([]);

    if (!nextPlan?.remoteId || nextPlan.membershipStatus !== 'APPROVED') {
      return () => {
        active = false;
      };
    }

    void listIcebreakers(
      idToken,
      nextPlan.category === 'circle' ? 'CIRCLE' : 'EVENT',
      nextPlan.remoteId,
    )
      .then((payload) => {
        if (active) {
          setNextPlanMembers(payload.members);
        }
      })
      .catch(() => {
        if (active) {
          setNextPlanMembers([]);
        }
      });

    return () => {
      active = false;
    };
  }, [idToken, nextPlan]);

  const loadCommunityData = async () => {
    try {
      setLoadError(undefined);
      const [eventsPayload, circlesPayload, activitiesPayload] =
        await Promise.all([
          listEvents(idToken, user.city),
          listCircles(idToken, user.city),
          listMyActivities(idToken),
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
        ...activitiesPayload.circles.flatMap((membership) => {
          if (!membership.circle) {
            return [];
          }

          const base = activityToDiscoveryItem(membership.circle, 'circle');
          const occurrences = membership.circle.occurrences ?? [];
          const visibleOccurrences =
            membership.status === 'APPROVED' || membership.status === 'ATTENDED'
              ? occurrences
              : occurrences
                  .filter(
                    (occurrence) =>
                      new Date(occurrence.startsAt).getTime() >= Date.now(),
                  )
                  .slice(0, 1);

          if (!visibleOccurrences.length) {
            return [{ ...base, membershipStatus: membership.status }];
          }

          return visibleOccurrences.map((occurrence) => ({
            ...base,
            id: `${base.id}:${occurrence.id}`,
            occurrenceId: occurrence.id,
            startsAt: occurrence.startsAt,
            time: formatActivityDate(occurrence.startsAt),
            membershipStatus: membership.status,
          }));
        }),
        ...activitiesPayload.hostedEvents.map((event) => ({
          ...activityToDiscoveryItem(event, 'event'),
          membershipStatus: 'APPROVED' as const,
        })),
        ...activitiesPayload.hostedCircles.flatMap((circle) => {
          const base = activityToDiscoveryItem(circle, 'circle');
          const occurrences = circle.occurrences ?? [];

          return occurrences.length
            ? occurrences.map((occurrence) => ({
                ...base,
                id: `${base.id}:${occurrence.id}`,
                membershipStatus: 'APPROVED' as const,
                occurrenceId: occurrence.id,
                startsAt: occurrence.startsAt,
                time: formatActivityDate(occurrence.startsAt),
              }))
            : [{ ...base, membershipStatus: 'APPROVED' as const }];
        }),
      ];
      setApiEvents(events);
      setApiCircles(circles);
      setMyActivities(memberships);

      void Promise.all([
        listNotifications(idToken),
        getSettings(idToken),
        listBlocks(idToken),
        getHostApproval(idToken),
        listRecommendations(idToken),
      ])
        .then(
          ([
            notificationsPayload,
            settingsPayload,
            blocksPayload,
            hostApprovalPayload,
            recommendationsPayload,
          ]) => {
            const recommendations =
              recommendationsPayload.recommendations.flatMap((activity) =>
                activity.category === 'circle' || activity.category === 'event'
                  ? [activityToDiscoveryItem(activity, activity.category)]
                  : [],
              );

            setNotifications(notificationsPayload.notifications);
            setSettings(settingsPayload.settings);
            setBlockedUsers(blocksPayload.blocks);
            setHostApproval(hostApprovalPayload.approval);
            setApiRecommendations(recommendations);
          },
        )
        .catch((error) => {
          console.warn('Unable to load non-critical community data.', error);
        });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load live Niva data.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retryCommunityData = async () => {
    setIsLoading(true);
    await loadCommunityData();
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
    softHaptic();

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
        onStartVerification(item.title, activeTab);
        return;
      }

      setBlockedModalVisible(true);
      return;
    }

    setJoinCandidate(item);
  };

  const changeTab = (tab: Tab) => {
    if (tab !== activeTab) {
      softHaptic();
      setActiveTab(tab);
    }
  };

  const openItem = (item: DiscoveryItem) => {
    softHaptic();
    setSelectedItem(item);
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
      const coverImageUrl = input.coverImage
        ? await uploadActivityCover(input.coverImage)
        : undefined;
      await createCommunityEvent(idToken, {
        capacity: input.capacity,
        city: input.city,
        coverImageUrl,
        description: input.description,
        difficulty: input.difficulty,
        hostNote: input.hostNote,
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
      throw error;
    }
  };

  const createHostedCircle = async (input: CreateCircleInput) => {
    try {
      const coverImageUrl = input.coverImage
        ? await uploadActivityCover(input.coverImage)
        : undefined;
      await createCommunityCircle(idToken, {
        capacity: input.capacity,
        city: input.city,
        coverImageUrl,
        description: input.description,
        difficulty: input.difficulty,
        durationWeeks: input.durationWeeks,
        hostNote: input.hostNote,
        interests: input.interests,
        latitude: input.latitude,
        locationName: input.locationName,
        longitude: input.longitude,
        recurrenceIntervalWeeks: input.recurrenceIntervalWeeks,
        schedule: input.schedule,
        startsAt: input.startsAt,
        title: input.title,
        timezone: input.timezone,
      });
      setSecondaryScreen(undefined);
      await loadCommunityData();
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : 'Unable to create circle.',
      );
      throw error;
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
    const coverImageUrl = input.coverImage
      ? await uploadActivityCover(input.coverImage)
      : undefined;
    if (editingActivity.category === 'circle') {
      await updateCircle(idToken, activityId, {
        capacity: input.capacity,
        city: input.city,
        coverImageUrl,
        description: input.description,
        difficulty: input.difficulty,
        hostNote: input.hostNote,
        durationWeeks: input.durationWeeks,
        interests: input.interests,
        latitude: input.latitude,
        locationName: input.locationName,
        longitude: input.longitude,
        recurrenceIntervalWeeks: input.recurrenceIntervalWeeks,
        schedule: input.schedule,
        startsAt: input.startsAt,
        title: input.title,
        timezone: input.timezone,
      });
    } else {
      await updateEvent(idToken, activityId, {
        capacity: input.capacity,
        city: input.city,
        coverImageUrl,
        description: input.description,
        difficulty: input.difficulty,
        hostNote: input.hostNote,
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
      if (
        nextSettings.notificationsEnabled &&
        !settings?.notificationsEnabled
      ) {
        const registration = await registerForPushNotifications(idToken);
        if (!registration.registered) {
          throw new Error(
            registration.reason ?? 'Push notifications could not be enabled.',
          );
        }
      }
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

  const openNotification = (notification: NotificationItem) => {
    if (!notification.readAt) {
      void readNotification(notification.id);
    }

    const activityId =
      notification.metadata?.eventId ?? notification.metadata?.circleId;
    const activity = activityId
      ? allItems.find((item) => item.remoteId === activityId)
      : undefined;
    if (activity) {
      setSecondaryScreen(undefined);
      setSelectedItem(activity);
    }
  };

  const submitReport = async (
    item: DiscoveryItem,
    input: { details?: string; reason: ReportReason },
  ) => {
    await reportUser(idToken, {
      circleId: item.category === 'circle' ? item.remoteId : undefined,
      details: input.details,
      eventId: item.category === 'event' ? item.remoteId : undefined,
      reason: input.reason,
      reportedUserId: item.hostId,
    });
    setReportItem(undefined);
    Alert.alert(
      'Report submitted',
      'Your report is private. Niva moderation will review it.',
    );
    await loadCommunityData();
  };

  if (reportItem) {
    return (
      <ReportScreen
        onBack={() => setReportItem(undefined)}
        onSubmit={(input) => submitReport(reportItem, input)}
        targetName={reportItem.host
          .replace('Hosted by ', '')
          .replace('Led by ', '')}
      />
    );
  }

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
        attendees={detailMembers}
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
        onReport={() => {
          setReportItem(selectedItem);
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

  if (managedEvent) {
    return (
      <ManageEventScreen
        event={managedEvent}
        idToken={idToken}
        onBack={() => setManagedEvent(undefined)}
        onEdit={() => {
          setEditingActivity(managedEvent);
          setManagedEvent(undefined);
        }}
        onOpenChat={() => {
          setChatItem(managedEvent);
          setManagedEvent(undefined);
        }}
      />
    );
  }

  if (managedCircle) {
    return (
      <ManageCircleScreen
        circle={managedCircle}
        idToken={idToken}
        onBack={() => setManagedCircle(undefined)}
        onEdit={() => {
          setEditingActivity(managedCircle);
          setManagedCircle(undefined);
        }}
        onOpenChat={() => {
          setChatItem(managedCircle);
          setManagedCircle(undefined);
        }}
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
        onOpenChat={() => {
          setIcebreakerActivity(undefined);
          setChatItem(icebreakerActivity);
        }}
        onViewPlan={() => setIcebreakerActivity(undefined)}
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
        onMarkAllRead={() => {
          notifications
            .filter((notification) => !notification.readAt)
            .forEach((notification) => void readNotification(notification.id));
        }}
        onOpen={openNotification}
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
        onEditProfile={onEditProfile}
        onLogout={onLogout}
        onStartVerification={() => onStartVerification(undefined, 'profile')}
        onUnblock={(blockedUserId) => void unblockMember(blockedUserId)}
        settings={settings ?? defaultSettings}
        verificationStatus={user.verificationStatus}
      />
    );
  }

  if (secondaryScreen === 'host-pathway') {
    return (
      <HostPathwayScreen
        approval={hostApproval}
        onApply={() => void requestHostAccess()}
        onBack={() => setSecondaryScreen(undefined)}
        user={user}
      />
    );
  }

  if (secondaryScreen === 'create-event') {
    return (
      <CreateEventScreen
        hostApproved={hostApproval?.status === 'APPROVED'}
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
            {apiError ? (
              <View style={styles.apiBanner}>
                <Text style={styles.apiBannerText}>{apiError}</Text>
              </View>
            ) : null}
            {loadError ? (
              <View style={styles.apiBanner}>
                <Text style={styles.apiBannerText}>{loadError}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void retryCommunityData()}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
            {isLoading ? <HomeShimmer /> : null}
            {!isLoading ? (
              <Section title="Your next plan">
                {nextPlan ? (
                  <HomePlanHero
                    attendees={nextPlanMembers}
                    item={nextPlan}
                    onOpen={() => openItem(nextPlan)}
                    onPeople={() => {
                      softHaptic();
                      setIcebreakerActivity(nextPlan);
                    }}
                  />
                ) : (
                  <IllustratedEmptyState
                    actionLabel="Explore plans"
                    onAction={() => changeTab('explore')}
                    text="Find a small gathering that feels like your kind of afternoon."
                    title="Your next plan starts here"
                  />
                )}
              </Section>
            ) : null}
            <Section title="Recommended for you">
              {homeRecommendations.length ? (
                <View style={styles.homeRecommendationList}>
                  {homeRecommendations.map((item, index) => (
                    <HomeRecommendationCard
                      artwork={activityArtwork(item, index)}
                      item={item}
                      key={item.id}
                      onJoin={() => requestJoin(item)}
                      onOpen={() => openItem(item)}
                      reason={recommendationReason(item, user)}
                    />
                  ))}
                </View>
              ) : (
                <IllustratedEmptyState
                  actionLabel="Browse everything"
                  onAction={() => changeTab('explore')}
                  text="New plans will appear here as hosts publish them in your city."
                  title="Recommendations are warming up"
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
              title="Explore"
              subtitle="Find plans by activity or area."
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
              {availableFilters.map((filter) => (
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
            {isLoading ? (
              <ListShimmer label="Loading nearby plans" />
            ) : exploreResults.length ? (
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
        return isLoading ? (
          <ListShimmer label="Loading your plans" />
        ) : (
          <MyActivitiesScreen
            embedded
            items={myActivities}
            onChat={setChatItem}
            onFeedback={setFeedbackEvent}
            onLeave={(item) => void leaveActivity(item)}
            onOpen={setSelectedItem}
          />
        );
      case 'chats':
        return (
          <ChatsOverview
            items={myActivities}
            loading={isLoading}
            onBrowse={() => changeTab('explore')}
            onOpen={setChatItem}
          />
        );
      case 'profile':
        return (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                {user.profilePhotoUrl ? (
                  <Image
                    source={{ uri: user.profilePhotoUrl }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <CircleUserRound
                    color={colors.primary}
                    size={46}
                    strokeWidth={1.9}
                  />
                )}
              </View>
              <View style={styles.profileHeaderCopy}>
                <Text numberOfLines={1} style={styles.profileName}>
                  {user.displayName}
                </Text>
                <Text style={styles.profileHandle}>
                  @{user.username} · {user.city}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onEditProfile}
                style={styles.profileEditButton}
              >
                <Pencil color={colors.primary} size={16} strokeWidth={2.4} />
                <Text style={styles.profileEditText}>Edit</Text>
              </Pressable>
            </View>

            {user.bio ? (
              <Text style={styles.profileBio}>{user.bio}</Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={onEditProfile}
                style={styles.addBioButton}
              >
                <Text style={styles.addBioText}>Add your About me</Text>
              </Pressable>
            )}

            <View style={styles.profileInterests}>
              {user.interests.map((interest) => (
                <Text key={interest} style={styles.profileInterest}>
                  {interest}
                </Text>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setSecondaryScreen('host-pathway')}
              style={styles.hostPathCard}
            >
              <View style={styles.hostPathCopy}>
                <Text style={styles.hostPathEyebrow}>HOST WITH NIVA</Text>
                <Text style={styles.hostPathTitle}>
                  {hostApproval?.status === 'APPROVED'
                    ? hostToolsEnabled
                      ? 'Your hosting tools'
                      : 'Host access approved'
                    : 'Bring a thoughtful plan to life'}
                </Text>
                <Text style={styles.hostPathText}>
                  {hostApproval?.status === 'PENDING'
                    ? 'Your application is under review.'
                    : hostApproval?.status === 'APPROVED' && !hostToolsEnabled
                      ? 'Creation tools will appear here when hosting opens.'
                      : 'Learn what hosts do and how approval works.'}
                </Text>
                <View style={styles.hostPathAction}>
                  <Text style={styles.hostPathActionText}>View hosting</Text>
                  <ArrowRight
                    color={colors.surface}
                    size={16}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
              <Image
                resizeMode="cover"
                source={curatedArtwork.books}
                style={styles.hostPathImage}
              />
            </Pressable>

            {hostToolsEnabled && hostApproval?.status === 'APPROVED' ? (
              <View style={styles.hostCreateRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSecondaryScreen('create-event')}
                  style={styles.hostCreateButton}
                >
                  <CalendarDays
                    color={colors.primary}
                    size={18}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.hostCreateText}>Create event</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSecondaryScreen('create-circle')}
                  style={styles.hostCreateButton}
                >
                  <UsersRound
                    color={colors.primary}
                    size={18}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.hostCreateText}>Create circle</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.profileMenu}>
              <ProfileMenuRow
                icon={
                  <Settings
                    color={colors.primary}
                    size={20}
                    strokeWidth={2.3}
                  />
                }
                label="Settings"
                onPress={() => setSecondaryScreen('settings')}
                last
              />
            </View>
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
        <JoinSuccessToast
          activityTitle={joinRequest}
          onDismiss={() => setJoinRequest(undefined)}
        />
      ) : null}

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <Pressable
              accessibilityLabel={`${tab.label} tab`}
              accessibilityRole="button"
              key={tab.id}
              onPress={() => changeTab(tab.id)}
              style={[styles.tabButton, active && styles.tabButtonActive]}
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
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const greeting = greetingForCurrentTime();
  const firstName = user.displayName.trim().split(/\s+/)[0] || user.displayName;

  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerCopy}>
        <Text numberOfLines={2} style={styles.greeting}>
          {greeting},{compact ? `\n` : ' '}
          {firstName}
        </Text>
        <Text style={styles.city}>{user.city}</Text>
      </View>
      <Pressable
        accessibilityLabel="Open notifications"
        accessibilityRole="button"
        onPress={onOpenNotifications}
        style={[styles.headerBadge, compact && styles.headerBadgeCompact]}
      >
        <Bell color={colors.primary} size={20} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

function HomeShimmer() {
  const opacity = useRef(new Animated.Value(0.38)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
      if (!mounted || reducedMotion) {
        opacity.setValue(0.58);
        return;
      }

      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            duration: 760,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.78,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            duration: 760,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.38,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    });

    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [opacity]);

  return (
    <View accessibilityLabel="Loading your Niva plans" style={styles.shimmer}>
      <Animated.View style={[styles.shimmerHero, { opacity }]} />
      <View style={styles.shimmerRow}>
        <Animated.View style={[styles.shimmerImage, { opacity }]} />
        <View style={styles.shimmerCopy}>
          <Animated.View style={[styles.shimmerLineWide, { opacity }]} />
          <Animated.View style={[styles.shimmerLine, { opacity }]} />
          <Animated.View style={[styles.shimmerLineShort, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

function ListShimmer({ label }: { label: string }) {
  const opacity = useRef(new Animated.Value(0.38)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 720,
          toValue: 0.78,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 720,
          toValue: 0.38,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View accessibilityLabel={label} style={styles.listShimmer}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.listShimmerCard}>
          <Animated.View style={[styles.listShimmerImage, { opacity }]} />
          <View style={styles.shimmerCopy}>
            <Animated.View style={[styles.shimmerLineWide, { opacity }]} />
            <Animated.View style={[styles.shimmerLine, { opacity }]} />
            <Animated.View style={[styles.shimmerLineShort, { opacity }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function greetingForCurrentTime() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 17) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

function HomePlanHero({
  attendees,
  item,
  onOpen,
  onPeople,
}: {
  attendees: IcebreakerMember[];
  item: DiscoveryItem;
  onOpen: () => void;
  onPeople: () => void;
}) {
  return (
    <View style={styles.homeHero}>
      <View style={styles.homeHeroMain}>
        <View style={styles.homeHeroContent}>
          <Text style={styles.homeHeroEyebrow}>
            {formatCategory(item.category)} · {countdownLabel(item.startsAt)}
          </Text>
          <Text numberOfLines={2} style={styles.homeHeroTitle}>
            {item.title}
          </Text>
          <View style={styles.homeHeroMetaRow}>
            <MapPin color={colors.accent} size={16} strokeWidth={2.5} />
            <Text numberOfLines={1} style={styles.homeHeroMetaText}>
              {item.location}
            </Text>
          </View>
          <View style={styles.homeHeroMetaRow}>
            <UsersRound color={colors.accent} size={16} strokeWidth={2.5} />
            <Text style={styles.homeHeroMetaText}>
              {item.capacity ? `Up to ${item.capacity} people` : 'Hosted plan'}
            </Text>
          </View>
        </View>
        <View style={styles.homeHeroImage}>
          <Image
            resizeMode="cover"
            source={resolveActivityCardArtwork(item)}
            style={styles.artworkFill}
          />
        </View>
        <Pressable
          accessibilityLabel={`View ${item.title}`}
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [
            styles.homeHeroButton,
            pressed && styles.homeHeroButtonPressed,
          ]}
        >
          <Text style={styles.homeHeroButtonText}>View</Text>
          <ArrowRight color={colors.primary} size={17} strokeWidth={2.6} />
        </Pressable>
      </View>
      <Pressable
        accessibilityHint="Available only after your join request is approved"
        accessibilityRole="button"
        onPress={onPeople}
        style={styles.peoplePreview}
      >
        <View style={styles.peopleAvatars}>
          {(attendees.length ? attendees.slice(0, 4) : [undefined]).map(
            (member, index) => (
              <View
                key={member?.id ?? index}
                style={[
                  styles.peopleAvatar,
                  index > 0 && styles.peopleAvatarOverlap,
                ]}
              >
                {member?.profilePhotoUrl ? (
                  <Image
                    source={{ uri: member.profilePhotoUrl }}
                    style={styles.peopleAvatarImage}
                  />
                ) : (
                  <CircleUserRound
                    color={colors.secondary}
                    size={20}
                    strokeWidth={2.2}
                  />
                )}
              </View>
            ),
          )}
        </View>
        <View style={styles.peoplePreviewCopy}>
          <Text style={styles.peoplePreviewTitle}>People you’ll meet</Text>
          <Text style={styles.peoplePreviewText}>
            {attendees.length
              ? `${attendees.length} approved ${attendees.length === 1 ? 'member' : 'members'} going`
              : 'You’re the first approved member'}
          </Text>
        </View>
        <View style={styles.peoplePrivacy}>
          <LockKeyhole color={colors.secondary} size={14} strokeWidth={2.6} />
          <Text style={styles.peoplePrivacyText}>Approved</Text>
        </View>
      </Pressable>
    </View>
  );
}

function HomeRecommendationCard({
  artwork,
  item,
  onJoin,
  onOpen,
  reason,
}: {
  artwork: ImageSourcePropType;
  item: DiscoveryItem;
  onJoin: () => void;
  onOpen: () => void;
  reason: string;
}) {
  const alreadyJoined = Boolean(item.membershipStatus);

  return (
    <Pressable
      accessibilityLabel={`Open ${item.title}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.homeRecommendationCard,
        pressed && styles.homeRecommendationCardPressed,
      ]}
    >
      <View style={styles.homeRecommendationImage}>
        <Image resizeMode="cover" source={artwork} style={styles.artworkFill} />
      </View>
      <View style={styles.homeRecommendationBody}>
        <View style={styles.homeRecommendationTopRow}>
          <Text style={styles.homeRecommendationCategory}>
            {formatCategory(item.category)}
          </Text>
          {item.seats !== undefined ? (
            <Text style={styles.homeRecommendationSeats}>
              {item.seats ? `${item.seats} spots` : 'Full'}
            </Text>
          ) : null}
        </View>
        <Text numberOfLines={2} style={styles.homeRecommendationTitle}>
          {item.title}
        </Text>
        <View style={styles.homeRecommendationMetaRow}>
          <MapPin color={colors.muted} size={14} strokeWidth={2.4} />
          <Text numberOfLines={1} style={styles.homeRecommendationMeta}>
            {item.location}
          </Text>
        </View>
        <View style={styles.homeRecommendationMetaRow}>
          <Clock3 color={colors.muted} size={14} strokeWidth={2.4} />
          <Text numberOfLines={1} style={styles.homeRecommendationMeta}>
            {item.time}
          </Text>
        </View>
        <View style={styles.recommendationReason}>
          <Sparkles color={colors.primaryDark} size={13} strokeWidth={2.5} />
          <Text numberOfLines={1} style={styles.recommendationReasonText}>
            {reason}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={alreadyJoined ? 'View plan' : `Join ${item.title}`}
        accessibilityRole="button"
        onPress={alreadyJoined ? onOpen : onJoin}
        style={styles.homeRecommendationAction}
      >
        <ArrowRight color={colors.surface} size={18} strokeWidth={2.7} />
      </Pressable>
    </Pressable>
  );
}

function IllustratedEmptyState({
  actionLabel,
  onAction,
  text,
  title,
}: {
  actionLabel: string;
  onAction: () => void;
  text: string;
  title: string;
}) {
  return (
    <View style={styles.illustratedEmptyState}>
      <Image
        source={curatedArtwork.empty}
        style={styles.illustratedEmptyImage}
      />
      <View style={styles.illustratedEmptyCopy}>
        <Text style={styles.illustratedEmptyTitle}>{title}</Text>
        <Text style={styles.illustratedEmptyText}>{text}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={styles.illustratedEmptyAction}
        >
          <Text style={styles.illustratedEmptyActionText}>{actionLabel}</Text>
          <ArrowRight color={colors.primaryDark} size={17} strokeWidth={2.6} />
        </Pressable>
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
  icon?: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.screenTitle}>
      {icon ? <View style={styles.screenTitleIcon}>{icon}</View> : null}
      <View style={styles.screenTitleCopy}>
        <Text style={styles.screenTitleText}>{title}</Text>
        <Text style={styles.screenSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ChatsOverview({
  items,
  loading,
  onBrowse,
  onOpen,
}: {
  items: DiscoveryItem[];
  loading: boolean;
  onBrowse: () => void;
  onOpen: (item: DiscoveryItem) => void;
}) {
  const conversations = Array.from(
    new Map(
      items
        .filter(
          (item) =>
            item.activityStatus !== 'CANCELLED' &&
            (item.membershipStatus === 'APPROVED' ||
              item.membershipStatus === 'ATTENDED'),
        )
        .map((item) => [item.remoteId ?? item.id, item] as const),
    ).values(),
  );

  return (
    <View>
      <ScreenTitle
        subtitle="Chat with people in plans you have joined."
        title="Chats"
      />
      {loading ? (
        <ListShimmer label="Loading your chats" />
      ) : conversations.length ? (
        <View style={styles.chatList}>
          {conversations.map((item) => (
            <Pressable
              accessibilityLabel={`Open ${item.title} chat`}
              accessibilityRole="button"
              key={`${item.id}:${item.occurrenceId ?? 'activity'}`}
              onPress={() => onOpen(item)}
              style={styles.chatListRow}
            >
              <Image
                resizeMode="cover"
                source={resolveActivityCardArtwork(item)}
                style={styles.chatListImage}
              />
              <View style={styles.chatListCopy}>
                <Text numberOfLines={1} style={styles.chatListTitle}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={styles.chatListText}>
                  {item.category === 'circle' ? 'Circle chat' : 'Event chat'} ·{' '}
                  {item.location}
                </Text>
              </View>
              <View style={styles.chatListAction}>
                <MessageCircle
                  color={colors.primary}
                  size={20}
                  strokeWidth={2.3}
                />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <IllustratedEmptyState
          actionLabel="Find a plan"
          onAction={onBrowse}
          text="Your cohort chats appear after you join a plan."
          title="No chats yet"
        />
      )}
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
      {!compact ? (
        <View style={styles.discoveryCardImage}>
          <Image
            resizeMode="cover"
            source={resolveActivityCardArtwork(item)}
            style={styles.artworkFill}
          />
        </View>
      ) : null}
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

function JoinSuccessToast({
  activityTitle,
  onDismiss,
}: {
  activityTitle: string;
  onDismiss: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    successHaptic();
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) {
        return;
      }

      if (reduceMotion) {
        progress.setValue(1);
      } else {
        Animated.spring(progress, {
          damping: 16,
          mass: 0.7,
          stiffness: 170,
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }

      timer = setTimeout(() => {
        if (reduceMotion) {
          onDismiss();
          return;
        }

        Animated.timing(progress, {
          duration: 180,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }).start(({ finished }) => finished && onDismiss());
      }, 4200);
    });

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
      progress.stopAnimation();
    };
  }, [activityTitle, onDismiss, progress]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.toastIcon}>
        <CheckCircle2 color={colors.surface} size={19} strokeWidth={2.8} />
      </View>
      <View style={styles.toastCopy}>
        <Text style={styles.toastTitle}>Request sent</Text>
        <Text numberOfLines={2} style={styles.toastText}>
          We’ll let you know when {activityTitle}’s host responds.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Dismiss confirmation"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDismiss}
      >
        <X color={colors.surface} size={18} strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}

function activityArtwork(item: DiscoveryItem, index: number) {
  void index;
  return resolveActivityCardArtwork(item);
}

function recommendationReason(item: DiscoveryItem, user: NivaUser) {
  const userInterests = new Set(
    user.interests.map((interest) => interest.toLowerCase()),
  );
  const matches = item.interests.filter((interest) =>
    userInterests.has(interest.toLowerCase()),
  );

  if (matches.length >= 2) {
    return `Because you like ${matches.slice(0, 2).join(' + ')}`;
  }

  if (matches.length === 1) {
    return `Because you like ${matches[0]}`;
  }

  if (item.city?.toLowerCase() === user.city.toLowerCase()) {
    return `Popular in ${user.city}`;
  }

  return 'A thoughtful match for you';
}

function countdownLabel(startsAt?: string) {
  if (!startsAt) {
    return 'Coming up';
  }

  const difference = new Date(startsAt).getTime() - Date.now();
  if (difference <= 0) {
    return 'Starting soon';
  }

  const hours = Math.ceil(difference / (60 * 60 * 1000));
  if (hours < 24) {
    return `In ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  const days = Math.ceil(hours / 24);
  return `In ${days} ${days === 1 ? 'day' : 'days'}`;
}

function softHaptic() {
  if (Platform.OS === 'android') {
    Vibration.vibrate(8);
  }
}

function successHaptic() {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 12, 55, 18]);
  }
}

function ProfileMenuRow({
  icon,
  label,
  last = false,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.profileMenuRow, last && styles.profileMenuRowLast]}
    >
      <View style={styles.profileMenuIcon}>{icon}</View>
      <Text style={styles.profileMenuLabel}>{label}</Text>
      <ChevronRight color={colors.muted} size={20} strokeWidth={2.4} />
    </Pressable>
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

function activityToDiscoveryItem(
  activity: CommunityActivity,
  category: 'circle' | 'event',
): DiscoveryItem {
  const effectiveStartsAt =
    category === 'circle' && activity.occurrences?.length
      ? activity.occurrences[0].startsAt
      : activity.startsAt;
  const startsAt = new Date(effectiveStartsAt);
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
    coverImageUrl: activity.coverImageUrl ?? undefined,
    startsAt: effectiveStartsAt,
    occurrences: activity.occurrences,
    recurrenceIntervalWeeks: activity.recurrenceIntervalWeeks,
    hostId: activity.host?.id,
    hostBio: activity.host?.profile?.bio ?? undefined,
    hostNote: activity.hostNote?.trim() || undefined,
    hostProfilePhotoUrl: activity.host?.profile?.profilePhotoUrl ?? undefined,
    category,
    title: activity.title,
    location: activity.locationName,
    city: activity.city,
    latitude: activity.latitude ?? undefined,
    longitude: activity.longitude ?? undefined,
    membershipStatus: activity.membershipStatus,
    time:
      category === 'circle' && activity.schedule
        ? activity.schedule
        : formatActivityDate(effectiveStartsAt),
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
    timezone: activity.timezone,
  };
}

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  });
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
  artworkFill: {
    height: '100%',
    width: '100%',
  },
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
  loadingPanel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  listShimmer: { gap: spacing.md },
  listShimmerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 142,
    overflow: 'hidden',
    paddingRight: spacing.md,
  },
  listShimmerImage: { backgroundColor: colors.infoSoft, width: 112 },
  retryButton: {
    alignSelf: 'flex-start',
    borderColor: colors.warning,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryButtonText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
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
    overflow: 'hidden',
    padding: spacing.md,
  },
  discoveryCardImage: {
    alignSelf: 'stretch',
    aspectRatio: 3 / 2,
    backgroundColor: colors.infoSoft,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    overflow: 'hidden',
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
  chatList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chatListAction: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  chatListCopy: { flex: 1 },
  chatListImage: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    height: 58,
    width: 58,
  },
  chatListRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 82,
    padding: spacing.sm,
  },
  chatListText: {
    color: colors.muted,
    fontSize: typography.small,
    marginTop: 3,
  },
  chatListTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
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
    paddingTop: spacing.xl,
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
  filterButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  filterButtonText: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '800',
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
  filterSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  filterSheetHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 5,
    marginBottom: spacing.lg,
    width: 44,
  },
  filterSheetOption: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  filterSheetOptionActive: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.primary,
  },
  filterSheetOptionText: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '800',
  },
  filterSheetOptionTextActive: { color: colors.primary },
  filterSheetOptions: { gap: spacing.sm, marginTop: spacing.lg },
  filterSheetText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  filterSheetTitle: {
    color: colors.ink,
    fontSize: typography.heading,
    fontWeight: '900',
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
  headerCompact: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    width: 44,
  },
  headerBadgeCompact: {
    alignSelf: 'flex-start',
  },
  homeHero: {
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  homeHeroButton: {
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: 18,
    position: 'absolute',
    right: '34%',
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    top: 176,
    transform: [{ translateX: 28 }],
  },
  homeHeroButtonPressed: {
    opacity: 0.86,
    transform: [{ translateX: 28 }, { scale: 0.98 }],
  },
  homeHeroButtonText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '900',
  },
  homeHeroContent: {
    justifyContent: 'center',
    minHeight: 246,
    padding: spacing.lg,
    paddingRight: spacing.md,
    width: '66%',
  },
  homeHeroEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  homeHeroImage: {
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    width: '38%',
  },
  homeHeroMain: {
    backgroundColor: colors.primary,
    minHeight: 246,
    overflow: 'hidden',
    position: 'relative',
  },
  homeHeroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  homeHeroMetaText: {
    color: 'rgba(255,255,255,0.86)',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  homeHeroTitle: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.7,
    lineHeight: 29,
    marginBottom: spacing.xs,
  },
  homeRecommendationAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    bottom: spacing.md,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    width: 38,
  },
  homeRecommendationBody: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 44,
    paddingVertical: spacing.sm,
  },
  homeRecommendationCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 164,
    overflow: 'hidden',
    padding: spacing.sm,
    position: 'relative',
  },
  homeRecommendationCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  homeRecommendationCategory: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  homeRecommendationImage: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    height: 142,
    overflow: 'hidden',
    width: 116,
  },
  homeRecommendationList: {
    gap: spacing.md,
  },
  homeRecommendationMeta: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  homeRecommendationMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
  },
  homeRecommendationSeats: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
  },
  homeRecommendationTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 22,
    marginTop: 5,
  },
  homeRecommendationTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  horizontalCards: {
    marginRight: -spacing.lg,
  },
  illustratedEmptyAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  illustratedEmptyActionText: {
    color: colors.primaryDark,
    fontSize: typography.small,
    fontWeight: '900',
  },
  illustratedEmptyCopy: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  illustratedEmptyImage: {
    height: 178,
    width: '100%',
  },
  illustratedEmptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  illustratedEmptyText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  illustratedEmptyTitle: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '900',
    lineHeight: 25,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
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
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 74,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 74,
  },
  profileAvatarImage: { height: '100%', width: '100%' },
  profileBio: {
    color: colors.ink,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.lg,
  },
  addBioButton: {
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBioText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '800',
  },
  profileEditButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
  },
  profileEditText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '900',
  },
  profileHandle: {
    color: colors.muted,
    fontSize: typography.small,
    fontWeight: '700',
    marginTop: 3,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileHeaderCopy: { flex: 1, minWidth: 0 },
  profileName: {
    color: colors.ink,
    fontSize: typography.subheading,
    fontWeight: '900',
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
  profileMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  profileMenuIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  profileMenuLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body,
    fontWeight: '800',
  },
  profileMenuRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 66,
    paddingHorizontal: spacing.md,
  },
  profileMenuRowLast: { borderBottomWidth: 0 },
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
  profileVerification: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  profileVerificationIcon: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  profileVerificationIconPending: {
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  profileVerificationText: {
    color: colors.muted,
    fontSize: typography.small,
    lineHeight: 18,
    marginTop: 2,
  },
  profileVerificationTitle: {
    color: colors.ink,
    fontSize: typography.body,
    fontWeight: '900',
  },
  hostCreateButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
  },
  hostCreateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hostCreateText: {
    color: colors.primary,
    fontSize: typography.small,
    fontWeight: '900',
  },
  hostPathAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  hostPathActionText: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '900',
  },
  hostPathCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing.xl,
    minHeight: 188,
    overflow: 'hidden',
  },
  hostPathCopy: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingRight: spacing.sm,
  },
  hostPathEyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  hostPathImage: { height: '100%', width: '35%' },
  hostPathText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  hostPathTitle: {
    color: colors.surface,
    fontSize: typography.subheading,
    fontWeight: '900',
    lineHeight: 25,
    marginTop: spacing.xs,
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
  peopleAvatar: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  peopleAvatarOverlap: {
    marginLeft: -10,
  },
  peopleAvatarImage: {
    height: '100%',
    width: '100%',
  },
  peopleAvatars: {
    flexDirection: 'row',
    paddingLeft: 2,
  },
  peoplePreview: {
    alignItems: 'center',
    backgroundColor: colors.glass,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  peoplePreviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  peoplePreviewText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  peoplePreviewTitle: {
    color: colors.ink,
    fontSize: typography.small,
    fontWeight: '900',
  },
  peoplePrivacy: {
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  peoplePrivacyText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '900',
  },
  recommendationReason: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FCEAF0',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  recommendationReasonText: {
    color: colors.primaryDark,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '800',
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
  shimmer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  shimmerCopy: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  shimmerHero: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.lg,
    height: 214,
  },
  shimmerImage: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    height: 104,
    width: 92,
  },
  shimmerLine: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    height: 13,
    width: '72%',
  },
  shimmerLineShort: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    height: 13,
    width: '48%',
  },
  shimmerLineWide: {
    backgroundColor: colors.infoSoft,
    borderRadius: radius.pill,
    height: 18,
    width: '92%',
  },
  shimmerRow: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
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
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: spacing.sm,
    minHeight: 70,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    position: 'absolute',
    right: spacing.sm,
    shadowColor: colors.primaryDark,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    gap: 4,
    minHeight: 56,
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.infoSoft,
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
    backgroundColor: colors.secondary,
    borderRadius: 18,
    bottom: 92,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.md,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.md,
  },
  toastCopy: {
    flex: 1,
    minWidth: 0,
  },
  toastIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  toastText: {
    color: '#EAF8F4',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },
  toastTitle: {
    color: colors.surface,
    fontSize: typography.small,
    fontWeight: '900',
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
  trustDotPending: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  trustDotVerified: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  verticalCards: {
    gap: spacing.md,
  },
});
