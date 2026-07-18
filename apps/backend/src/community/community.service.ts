import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  ChatThreadType,
  CircleOccurrenceStatus,
  HostApprovalStatus,
  MembershipStatus,
  NotificationType,
  TrustTier,
  TrustVerificationStatus,
} from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { BlockUserDto } from './dto/block-user.dto';
import { CreateCircleDto } from './dto/create-circle.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { UpdateContinuityPreferenceDto } from './dto/update-continuity-preference.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpsertEmergencyContactDto } from './dto/upsert-emergency-contact.dto';

const activeMembershipStatuses: MembershipStatus[] = [
  MembershipStatus.REQUESTED,
  MembershipStatus.APPROVED,
  MembershipStatus.ATTENDED,
];

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationService,
    private readonly realtime: RealtimeService,
  ) {}

  async listEvents(userId: string, city?: string) {
    const blockedHostIds = await this.listMutuallyBlockedUserIds(userId);

    const events = await this.prisma.event.findMany({
      where: {
        status: ActivityStatus.PUBLISHED,
        startsAt: { gte: new Date() },
        city: city ? { equals: city, mode: 'insensitive' } : undefined,
        hostId: blockedHostIds.length ? { notIn: blockedHostIds } : undefined,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profile: { select: { bio: true, profilePhotoUrl: true } },
            trust: { select: { score: true } },
          },
        },
        members: {
          where: { userId },
          select: { status: true },
          take: 1,
        },
        _count: {
          select: {
            members: {
              where: { status: { in: activeMembershipStatuses } },
            },
          },
        },
      },
    });

    return events.map(({ members, ...event }) => {
      const membershipStatus = members[0]?.status;
      return {
        ...this.hideExactLocationUnlessApproved(
          userId,
          event,
          membershipStatus,
        ),
        membershipStatus,
      };
    });
  }

  async listCircles(userId: string, city?: string) {
    const blockedHostIds = await this.listMutuallyBlockedUserIds(userId);

    const circles = await this.prisma.circle.findMany({
      where: {
        status: ActivityStatus.PUBLISHED,
        city: city ? { equals: city, mode: 'insensitive' } : undefined,
        hostId: blockedHostIds.length ? { notIn: blockedHostIds } : undefined,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profile: { select: { bio: true, profilePhotoUrl: true } },
            trust: { select: { score: true } },
          },
        },
        members: {
          where: { userId },
          select: { status: true },
          take: 1,
        },
        _count: {
          select: {
            members: {
              where: { status: { in: activeMembershipStatuses } },
            },
          },
        },
        occurrences: {
          where: {
            startsAt: { gte: new Date() },
            status: CircleOccurrenceStatus.SCHEDULED,
          },
          orderBy: { startsAt: 'asc' },
          take: 16,
        },
      },
    });

    return circles.map(({ members, ...circle }) => {
      const membershipStatus = members[0]?.status;
      return {
        ...this.hideExactLocationUnlessApproved(
          userId,
          circle,
          membershipStatus,
        ),
        membershipStatus,
      };
    });
  }

  private hideExactLocationUnlessApproved<
    T extends {
      city: string;
      hostId: string | null;
      latitude: number | null;
      locationName: string;
      longitude: number | null;
    },
  >(userId: string, activity: T, membershipStatus?: MembershipStatus): T {
    const canViewExactLocation =
      activity.hostId === userId ||
      membershipStatus === MembershipStatus.APPROVED ||
      membershipStatus === MembershipStatus.ATTENDED;

    return canViewExactLocation
      ? activity
      : {
          ...activity,
          latitude: null,
          locationName: activity.city,
          longitude: null,
        };
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    await this.assertCanHost(userId);
    const startsAt = this.parseFutureActivityTime(dto.startsAt, 'start time');
    const endsAt = dto.endsAt
      ? this.parseActivityTime(dto.endsAt, 'end time')
      : undefined;
    this.assertEventTimeRange(startsAt, endsAt);
    const interests = this.normalizeRequiredList(dto.interests, 'interests');

    return this.prisma.event.create({
      data: {
        hostId: userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        coverImageUrl: dto.coverImageUrl,
        hostNote: dto.hostNote?.trim() || undefined,
        city: dto.city.trim(),
        locationName: dto.locationName.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        startsAt,
        endsAt,
        capacity: dto.capacity,
        difficulty: dto.difficulty,
        interests,
        chatThread: {
          create: { type: 'EVENT' },
        },
      },
      include: { chatThread: true },
    });
  }

  async createCircle(userId: string, dto: CreateCircleDto) {
    await this.assertCanHost(userId);
    const startsAt = this.parseFutureActivityTime(
      dto.startsAt,
      'first session',
    );
    const interests = this.normalizeRequiredList(dto.interests, 'interests');
    const occurrences = this.buildCircleOccurrences(
      startsAt,
      dto.durationWeeks,
      dto.recurrenceIntervalWeeks,
    );

    return this.prisma.circle.create({
      data: {
        hostId: userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        coverImageUrl: dto.coverImageUrl,
        hostNote: dto.hostNote?.trim() || undefined,
        city: dto.city.trim(),
        locationName: dto.locationName.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        startsAt,
        schedule: dto.schedule.trim(),
        durationWeeks: dto.durationWeeks,
        recurrenceIntervalWeeks: dto.recurrenceIntervalWeeks,
        timezone: dto.timezone.trim(),
        capacity: dto.capacity,
        difficulty: dto.difficulty,
        interests,
        chatThread: {
          create: { type: ChatThreadType.CIRCLE },
        },
        occurrences: {
          create: occurrences.map((occurrenceStartsAt) => ({
            startsAt: occurrenceStartsAt,
          })),
        },
      },
      include: { chatThread: true, occurrences: true },
    });
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.assertEventHost(userId, eventId);
    this.assertActivityCanBeChanged(event.status);
    await this.assertEventCapacity(eventId, dto.capacity);
    const startsAt = dto.startsAt
      ? this.parseFutureActivityTime(dto.startsAt, 'start time')
      : event.startsAt;
    const endsAt = dto.endsAt
      ? this.parseActivityTime(dto.endsAt, 'end time')
      : event.endsAt;

    if (dto.startsAt || dto.endsAt) {
      this.assertEventTimeRange(startsAt, endsAt);
    }
    const interests = dto.interests
      ? this.normalizeRequiredList(dto.interests, 'interests')
      : undefined;

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        capacity: dto.capacity,
        city: dto.city?.trim(),
        description: dto.description?.trim(),
        coverImageUrl: dto.coverImageUrl,
        hostNote:
          dto.hostNote !== undefined ? dto.hostNote.trim() || null : undefined,
        difficulty: dto.difficulty,
        endsAt,
        interests,
        locationName: dto.locationName?.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        startsAt: dto.startsAt ? startsAt : undefined,
        title: dto.title?.trim(),
      },
    });

    await this.notifyActivityMembers('EVENT', eventId, updated.title, {
      eventId,
      updatedFields: this.updatedFields(dto),
    });
    this.realtime.publishToCohort(
      ChatThreadType.EVENT,
      eventId,
      'cohort:activity-updated',
      { activityId: eventId, type: ChatThreadType.EVENT },
    );

    return updated;
  }

  async updateCircle(userId: string, circleId: string, dto: UpdateCircleDto) {
    const circle = await this.assertCircleHost(userId, circleId);
    this.assertActivityCanBeChanged(circle.status);
    await this.assertCircleCapacity(circleId, dto.capacity);
    const startsAt = dto.startsAt
      ? this.parseFutureActivityTime(dto.startsAt, 'first session')
      : circle.startsAt;
    const interests = dto.interests
      ? this.normalizeRequiredList(dto.interests, 'interests')
      : undefined;
    const recurrenceChanged = Boolean(
      dto.startsAt ||
      dto.durationWeeks !== undefined ||
      dto.recurrenceIntervalWeeks !== undefined,
    );
    const durationWeeks = dto.durationWeeks ?? circle.durationWeeks;
    const recurrenceIntervalWeeks =
      dto.recurrenceIntervalWeeks ?? circle.recurrenceIntervalWeeks;
    const occurrences = recurrenceChanged
      ? this.buildCircleOccurrences(
          startsAt,
          durationWeeks,
          recurrenceIntervalWeeks,
        )
      : [];

    const updated = await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        capacity: dto.capacity,
        city: dto.city?.trim(),
        description: dto.description?.trim(),
        coverImageUrl: dto.coverImageUrl,
        hostNote:
          dto.hostNote !== undefined ? dto.hostNote.trim() || null : undefined,
        difficulty: dto.difficulty,
        durationWeeks: dto.durationWeeks,
        recurrenceIntervalWeeks: dto.recurrenceIntervalWeeks,
        timezone: dto.timezone?.trim(),
        interests,
        locationName: dto.locationName?.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        schedule: dto.schedule?.trim(),
        startsAt: dto.startsAt ? startsAt : undefined,
        title: dto.title?.trim(),
        occurrences: recurrenceChanged
          ? {
              deleteMany: { startsAt: { gte: new Date() } },
              create: occurrences.map((occurrenceStartsAt) => ({
                startsAt: occurrenceStartsAt,
              })),
            }
          : undefined,
      },
      include: { occurrences: { orderBy: { startsAt: 'asc' } } },
    });

    await this.notifyActivityMembers('CIRCLE', circleId, updated.title, {
      circleId,
      updatedFields: this.updatedFields(dto),
    });
    this.realtime.publishToCohort(
      ChatThreadType.CIRCLE,
      circleId,
      'cohort:activity-updated',
      { activityId: circleId, type: ChatThreadType.CIRCLE },
    );

    return updated;
  }

  async cancelEvent(userId: string, eventId: string, reason: string) {
    const event = await this.assertEventHost(userId, eventId);
    this.assertActivityCanBeChanged(event.status);

    const cancelled = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        cancelledAt: new Date(),
        cancellationReason: reason.trim(),
        status: ActivityStatus.CANCELLED,
      },
    });
    await this.notifyActivityCancellation(
      'EVENT',
      eventId,
      cancelled.title,
      reason,
    );
    this.realtime.publishToCohort(
      ChatThreadType.EVENT,
      eventId,
      'cohort:activity-cancelled',
      {
        activityId: eventId,
        reason: reason.trim(),
        type: ChatThreadType.EVENT,
      },
    );

    return cancelled;
  }

  async cancelCircle(userId: string, circleId: string, reason: string) {
    const circle = await this.assertCircleHost(userId, circleId);
    this.assertActivityCanBeChanged(circle.status);

    const cancelled = await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        cancelledAt: new Date(),
        cancellationReason: reason.trim(),
        status: ActivityStatus.CANCELLED,
      },
    });
    await this.notifyActivityCancellation(
      'CIRCLE',
      circleId,
      cancelled.title,
      reason,
    );
    this.realtime.publishToCohort(
      ChatThreadType.CIRCLE,
      circleId,
      'cohort:activity-cancelled',
      {
        activityId: circleId,
        reason: reason.trim(),
        type: ChatThreadType.CIRCLE,
      },
    );

    return cancelled;
  }

  async joinEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { requiresVerification: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.requiresVerification) {
      await this.assertCanJoin(userId);
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const activity = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          capacity: true,
          id: true,
          status: true,
          title: true,
        },
      });

      if (!activity || activity.status !== ActivityStatus.PUBLISHED) {
        throw new NotFoundException('This event is no longer available.');
      }

      const existingMembership = await tx.eventMember.findUnique({
        where: { eventId_userId: { eventId, userId } },
        select: { status: true },
      });

      if (
        !existingMembership ||
        !activeMembershipStatuses.includes(existingMembership.status)
      ) {
        const memberCount = await tx.eventMember.count({
          where: {
            eventId,
            status: { in: activeMembershipStatuses },
          },
        });

        if (memberCount >= activity.capacity) {
          throw new BadRequestException('This event is full.');
        }
      }

      return tx.eventMember.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId },
        update: { status: MembershipStatus.REQUESTED },
        include: { event: true },
      });
    });

    await this.notifications.createForUser(userId, {
      type: NotificationType.JOIN_REQUEST_ACCEPTED,
      title: 'Join request received',
      body: `Your request for ${membership.event.title} is ready for host review.`,
      metadata: { eventId },
    });
    await this.recordAnalytics('JOIN_REQUESTED', { eventId, userId });
    if (membership.event.hostId) {
      this.realtime.publishToMember(
        membership.event.hostId,
        'activity:membership-updated',
        { activityId: eventId, type: ChatThreadType.EVENT },
      );
    }

    return membership;
  }

  async leaveEvent(userId: string, eventId: string) {
    await this.prisma.eventMember.updateMany({
      where: { eventId, userId },
      data: { status: MembershipStatus.CANCELLED },
    });

    return { left: true };
  }

  async joinCircle(userId: string, circleId: string) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      select: { requiresVerification: true },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found.');
    }

    if (circle.requiresVerification) {
      await this.assertCanJoin(userId);
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const activity = await tx.circle.findUnique({
        where: { id: circleId },
        select: {
          capacity: true,
          id: true,
          status: true,
          title: true,
        },
      });

      if (!activity || activity.status !== ActivityStatus.PUBLISHED) {
        throw new NotFoundException('This circle is no longer available.');
      }

      const existingMembership = await tx.circleMember.findUnique({
        where: { circleId_userId: { circleId, userId } },
        select: { status: true },
      });

      if (
        !existingMembership ||
        !activeMembershipStatuses.includes(existingMembership.status)
      ) {
        const memberCount = await tx.circleMember.count({
          where: {
            circleId,
            status: { in: activeMembershipStatuses },
          },
        });

        if (memberCount >= activity.capacity) {
          throw new BadRequestException('This circle is full.');
        }
      }

      return tx.circleMember.upsert({
        where: { circleId_userId: { circleId, userId } },
        create: { circleId, userId },
        update: { status: MembershipStatus.REQUESTED },
        include: { circle: true },
      });
    });

    await this.notifications.createForUser(userId, {
      type: NotificationType.CIRCLE_STARTING,
      title: 'Circle request received',
      body: `Your request for ${membership.circle.title} is ready for host review.`,
      metadata: { circleId },
    });
    await this.recordAnalytics('JOIN_REQUESTED', { circleId, userId });
    if (membership.circle.hostId) {
      this.realtime.publishToMember(
        membership.circle.hostId,
        'activity:membership-updated',
        { activityId: circleId, type: ChatThreadType.CIRCLE },
      );
    }

    return membership;
  }

  async leaveCircle(userId: string, circleId: string) {
    await this.prisma.circleMember.updateMany({
      where: { circleId, userId },
      data: { status: MembershipStatus.CANCELLED },
    });

    return { left: true };
  }

  async listMyActivities(userId: string) {
    const [events, circles, hostedEvents, hostedCircles] = await Promise.all([
      this.prisma.eventMember.findMany({
        where: { userId },
        orderBy: { joinedAt: 'desc' },
        include: {
          event: {
            include: {
              host: {
                select: {
                  id: true,
                  displayName: true,
                  username: true,
                  profile: { select: { bio: true, profilePhotoUrl: true } },
                  trust: { select: { score: true } },
                },
              },
              _count: {
                select: {
                  members: {
                    where: { status: { in: activeMembershipStatuses } },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.circleMember.findMany({
        where: { userId },
        orderBy: { joinedAt: 'desc' },
        include: {
          circle: {
            include: {
              host: {
                select: {
                  id: true,
                  displayName: true,
                  username: true,
                  profile: { select: { bio: true, profilePhotoUrl: true } },
                  trust: { select: { score: true } },
                },
              },
              _count: {
                select: {
                  members: {
                    where: { status: { in: activeMembershipStatuses } },
                  },
                },
              },
              occurrences: {
                where: {
                  status: {
                    in: [
                      CircleOccurrenceStatus.SCHEDULED,
                      CircleOccurrenceStatus.COMPLETED,
                    ],
                  },
                },
                orderBy: { startsAt: 'asc' },
                take: 32,
              },
            },
          },
        },
      }),
      this.prisma.event.findMany({
        where: { hostId: userId },
        orderBy: { startsAt: 'asc' },
        include: {
          host: {
            select: {
              id: true,
              displayName: true,
              username: true,
              profile: { select: { bio: true, profilePhotoUrl: true } },
              trust: { select: { score: true } },
            },
          },
          _count: {
            select: {
              members: {
                where: { status: { in: activeMembershipStatuses } },
              },
            },
          },
        },
      }),
      this.prisma.circle.findMany({
        where: { hostId: userId },
        orderBy: { startsAt: 'asc' },
        include: {
          host: {
            select: {
              id: true,
              displayName: true,
              username: true,
              profile: { select: { bio: true, profilePhotoUrl: true } },
              trust: { select: { score: true } },
            },
          },
          _count: {
            select: {
              members: {
                where: { status: { in: activeMembershipStatuses } },
              },
            },
          },
          occurrences: {
            where: {
              status: {
                in: [
                  CircleOccurrenceStatus.SCHEDULED,
                  CircleOccurrenceStatus.COMPLETED,
                ],
              },
            },
            orderBy: { startsAt: 'asc' },
            take: 32,
          },
        },
      }),
    ]);

    return { circles, events, hostedCircles, hostedEvents };
  }

  async getIcebreakers(
    userId: string,
    type: ChatThreadType,
    activityId: string,
  ) {
    await this.assertIcebreakerAccess(userId, type, activityId);
    const blockedUserIds = await this.listMutuallyBlockedUserIds(userId);
    const viewer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: { select: { interests: true } } },
    });
    const activity =
      type === ChatThreadType.EVENT
        ? await this.prisma.event.findUnique({
            where: { id: activityId },
            select: { interests: true, title: true },
          })
        : await this.prisma.circle.findUnique({
            where: { id: activityId },
            select: { interests: true, title: true },
          });

    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    const memberships =
      type === ChatThreadType.EVENT
        ? await this.prisma.eventMember.findMany({
            where: {
              eventId: activityId,
              status: MembershipStatus.APPROVED,
              userId: { notIn: [userId, ...blockedUserIds] },
            },
            include: {
              user: {
                select: {
                  displayName: true,
                  id: true,
                  profile: {
                    select: { interests: true, profilePhotoUrl: true },
                  },
                  settings: { select: { showInterestsInIcebreakers: true } },
                },
              },
            },
          })
        : await this.prisma.circleMember.findMany({
            where: {
              circleId: activityId,
              status: MembershipStatus.APPROVED,
              userId: { notIn: [userId, ...blockedUserIds] },
            },
            include: {
              user: {
                select: {
                  displayName: true,
                  id: true,
                  profile: {
                    select: { interests: true, profilePhotoUrl: true },
                  },
                  settings: { select: { showInterestsInIcebreakers: true } },
                },
              },
            },
          });
    const viewerInterests = viewer?.profile?.interests ?? [];
    const members = memberships
      .filter(
        (membership) =>
          membership.user.settings?.showInterestsInIcebreakers !== false,
      )
      .map((membership) => {
        const sharedInterests = this.sharedInterests(
          viewerInterests,
          membership.user.profile?.interests ?? [],
        );
        return {
          displayName: membership.user.displayName,
          id: membership.user.id,
          profilePhotoUrl: membership.user.profile?.profilePhotoUrl ?? null,
          prompts: this.icebreakerPrompts(
            activity.title,
            activity.interests,
            sharedInterests,
          ),
          sharedInterests,
        };
      });

    await this.recordAnalytics('ICEBREAKER_VIEWED', {
      circleId: type === ChatThreadType.CIRCLE ? activityId : undefined,
      eventId: type === ChatThreadType.EVENT ? activityId : undefined,
      metadata: { memberCount: members.length },
      userId,
    });

    return { activityTitle: activity.title, members };
  }

  async listRecommendations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        circleMemberships: { select: { circleId: true } },
        eventMemberships: { select: { eventId: true } },
        profile: { select: { city: true, interests: true } },
        settings: {
          select: {
            allowCircleContinuitySuggestions: true,
          },
        },
      },
    });
    if (!user?.profile?.city) {
      return { recommendations: [] };
    }

    const blockedHostIds = await this.listMutuallyBlockedUserIds(userId);
    const [preferences, events, circles] = await Promise.all([
      this.prisma.continuityPreference.findMany({
        where: { userId },
        select: { wantsCircleSuggestions: true, wantsSimilarEvents: true },
      }),
      this.prisma.event.findMany({
        where: {
          city: { equals: user.profile.city, mode: 'insensitive' },
          hostId: {
            notIn: [userId, ...blockedHostIds],
          },
          id: {
            notIn: user.eventMemberships.map(
              (membership) => membership.eventId,
            ),
          },
          status: ActivityStatus.PUBLISHED,
        },
        include: {
          _count: {
            select: {
              members: { where: { status: { in: activeMembershipStatuses } } },
            },
          },
          host: {
            select: {
              displayName: true,
              id: true,
              username: true,
              profile: { select: { bio: true, profilePhotoUrl: true } },
              trust: { select: { score: true } },
            },
          },
        },
        take: 40,
      }),
      this.prisma.circle.findMany({
        where: {
          city: { equals: user.profile.city, mode: 'insensitive' },
          hostId: {
            notIn: [userId, ...blockedHostIds],
          },
          id: {
            notIn: user.circleMemberships.map(
              (membership) => membership.circleId,
            ),
          },
          status: ActivityStatus.PUBLISHED,
        },
        include: {
          _count: {
            select: {
              members: { where: { status: { in: activeMembershipStatuses } } },
            },
          },
          host: {
            select: {
              displayName: true,
              id: true,
              username: true,
              profile: { select: { bio: true, profilePhotoUrl: true } },
              trust: { select: { score: true } },
            },
          },
        },
        take: 40,
      }),
    ]);
    const wantsSimilarEvents = preferences.some(
      (preference) => preference.wantsSimilarEvents,
    );
    const wantsCircles =
      user.settings?.allowCircleContinuitySuggestions !== false &&
      preferences.some((preference) => preference.wantsCircleSuggestions);
    const score = (interests: string[], category: 'circle' | 'event') => {
      const overlap = this.sharedInterests(
        user.profile?.interests ?? [],
        interests,
      );
      return (
        overlap.length * 10 +
        (category === 'event' && wantsSimilarEvents ? 3 : 0) +
        (category === 'circle' && wantsCircles ? 5 : 0)
      );
    };
    const recommendations = [
      ...events.map((event) => ({
        ...event,
        category: 'event' as const,
        score: score(event.interests, 'event'),
      })),
      ...(wantsCircles
        ? circles.map((circle) => ({
            ...circle,
            category: 'circle' as const,
            score: score(circle.interests, 'circle'),
          }))
        : []),
    ]
      .filter((activity) => activity.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.startsAt.getTime() - right.startsAt.getTime(),
      )
      .slice(0, 12);

    await this.recordAnalytics('RECOMMENDATIONS_VIEWED', {
      metadata: { recommendationCount: recommendations.length },
      userId,
    });
    return { recommendations };
  }

  async updateContinuityPreference(
    userId: string,
    eventId: string,
    dto: UpdateContinuityPreferenceDto,
  ) {
    const membership = await this.prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { status: true },
    });
    if (membership?.status !== MembershipStatus.ATTENDED) {
      throw new ForbiddenException(
        'Continuity preferences are available after attendance is recorded.',
      );
    }

    const preference = await this.prisma.continuityPreference.upsert({
      where: { userId_eventId: { eventId, userId } },
      create: {
        eventId,
        userId,
        wantsCircleSuggestions: dto.wantsCircleSuggestions,
        wantsSimilarEvents: dto.wantsSimilarEvents,
      },
      update: {
        wantsCircleSuggestions: dto.wantsCircleSuggestions,
        wantsSimilarEvents: dto.wantsSimilarEvents,
      },
    });
    await this.recordAnalytics('CONTINUITY_PREFERENCE_SET', {
      eventId,
      metadata: {
        wantsCircleSuggestions: dto.wantsCircleSuggestions,
        wantsSimilarEvents: dto.wantsSimilarEvents,
      },
      userId,
    });
    return preference;
  }

  async getEventFeedbackInsights(hostId: string, eventId: string) {
    await this.assertEventHost(hostId, eventId);
    const [summary, comments] = await Promise.all([
      this.prisma.eventFeedback.aggregate({
        where: { eventId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.eventFeedback.findMany({
        where: { body: { not: null }, eventId },
        orderBy: { createdAt: 'desc' },
        select: { body: true, createdAt: true, rating: true },
        take: 20,
      }),
    ]);

    return {
      averageRating: summary._avg.rating,
      comments: comments.map((comment) => ({
        body: comment.body,
        createdAt: comment.createdAt,
        rating: comment.rating,
      })),
      responseCount: summary._count.rating,
    };
  }

  async listChatMessages(
    userId: string,
    type: ChatThreadType,
    activityId: string,
  ) {
    const thread = await this.assertChatAccess(userId, type, activityId);
    const blockedUserIds = await this.listMutuallyBlockedUserIds(userId);

    return this.prisma.chatMessage.findMany({
      where: {
        threadId: thread.id,
        senderId: blockedUserIds.length ? { notIn: blockedUserIds } : undefined,
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: {
          select: { id: true, displayName: true, username: true },
        },
      },
    });
  }

  async authorizeCohortRealtimeAccess(
    userId: string,
    type: ChatThreadType,
    activityId: string,
  ) {
    await this.assertChatAccess(userId, type, activityId);
  }

  async sendChatMessage(
    userId: string,
    type: ChatThreadType,
    activityId: string,
    body: string,
  ) {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      throw new BadRequestException('A chat message cannot be empty.');
    }

    const thread = await this.assertChatAccess(userId, type, activityId);

    const message = await this.prisma.chatMessage.create({
      data: { threadId: thread.id, senderId: userId, body: trimmedBody },
      include: {
        sender: {
          select: { id: true, displayName: true, username: true },
        },
      },
    });
    this.realtime.publishToCohort(type, activityId, 'cohort:message', {
      activityId,
      message,
      type,
    });

    return message;
  }

  async requestHostApproval(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firebaseUid: true,
        trust: { select: { tier: true, verificationStatus: true } },
      },
    });
    const tier = user?.trust?.tier;
    const eligible =
      tier === TrustTier.TRUSTED ||
      tier === TrustTier.HOST_ELIGIBLE ||
      tier === TrustTier.HOST ||
      this.isVerifiedBetaMember(user);

    if (!eligible) {
      throw new ForbiddenException(
        'Host access requires a trusted account before review.',
      );
    }

    return this.prisma.hostApproval.upsert({
      where: { userId },
      create: {
        userId,
        status: HostApprovalStatus.PENDING,
        requestedAt: new Date(),
      },
      update: {
        status: HostApprovalStatus.PENDING,
        reason: null,
        reviewerId: null,
        requestedAt: new Date(),
        reviewedAt: null,
      },
    });
  }

  async getHostApproval(userId: string) {
    return this.prisma.hostApproval.findUnique({ where: { userId } });
  }

  async updateEventAttendance(
    hostId: string,
    eventId: string,
    memberId: string,
    status: 'ATTENDED' | 'NO_SHOW',
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true, title: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.hostId !== hostId) {
      throw new ForbiddenException(
        'Only the event host can update attendance.',
      );
    }

    const member = await this.prisma.eventMember.findUnique({
      where: { id: memberId },
      select: { id: true, eventId: true, status: true, userId: true },
    });

    if (!member || member.eventId !== eventId) {
      throw new NotFoundException('Event member not found.');
    }

    if (member.status !== MembershipStatus.APPROVED) {
      throw new BadRequestException(
        'Attendance can be recorded only for an approved member.',
      );
    }

    const updated = await this.prisma.eventMember.update({
      where: { id: member.id },
      data: { status },
    });
    await this.usersService.recordAttendanceOutcome(
      member.userId,
      status === MembershipStatus.ATTENDED ? 'EVENT_ATTENDED' : 'NO_SHOW',
      eventId,
    );
    await this.notifications.createForUser(member.userId, {
      type: NotificationType.ATTENDANCE_UPDATED,
      title:
        status === MembershipStatus.ATTENDED
          ? 'Attendance recorded'
          : 'Attendance update',
      body:
        status === MembershipStatus.ATTENDED
          ? `Thanks for attending ${event.title}.`
          : `Your attendance for ${event.title} was marked as no-show.`,
      metadata: { eventId, membershipId: member.id, status },
    });
    await this.recordAnalytics('ATTENDANCE_RECORDED', {
      eventId,
      metadata: { status },
      userId: member.userId,
    });
    this.publishMembershipUpdate(
      hostId,
      member.userId,
      ChatThreadType.EVENT,
      eventId,
      member.id,
      status,
    );

    return updated;
  }

  async listEventMembers(hostId: string, eventId: string) {
    await this.assertEventHost(hostId, eventId);

    return this.prisma.eventMember.findMany({
      where: { eventId },
      orderBy: { joinedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profile: {
              select: {
                bio: true,
                city: true,
                interests: true,
                profilePhotoUrl: true,
              },
            },
            trust: { select: { verificationStatus: true } },
          },
        },
      },
    });
  }

  async updateEventMembership(
    hostId: string,
    eventId: string,
    memberId: string,
    status: 'APPROVED' | 'CANCELLED',
  ) {
    const event = await this.assertEventHost(hostId, eventId);
    const member = await this.prisma.eventMember.findUnique({
      where: { id: memberId },
      select: { eventId: true, id: true, status: true, userId: true },
    });

    if (!member || member.eventId !== eventId) {
      throw new NotFoundException('Event member not found.');
    }

    if (
      member.status !== MembershipStatus.REQUESTED &&
      member.status !== MembershipStatus.APPROVED
    ) {
      throw new BadRequestException(
        'This membership can no longer be updated.',
      );
    }

    const updated = await this.prisma.eventMember.update({
      where: { id: member.id },
      data: { status },
    });
    await this.notifications.createForUser(member.userId, {
      type: NotificationType.JOIN_REQUEST_ACCEPTED,
      title:
        status === MembershipStatus.APPROVED
          ? 'Join request approved'
          : 'Join request update',
      body:
        status === MembershipStatus.APPROVED
          ? `You are confirmed for ${event.title}. Cohort chat is now open.`
          : `Your request for ${event.title} was not approved this time.`,
      metadata: { eventId, membershipId: member.id, status },
    });
    await this.recordAnalytics(
      status === MembershipStatus.APPROVED
        ? 'MEMBERSHIP_APPROVED'
        : 'JOIN_REQUEST_DECLINED',
      { eventId, userId: member.userId },
    );
    this.publishMembershipUpdate(
      hostId,
      member.userId,
      ChatThreadType.EVENT,
      eventId,
      member.id,
      status,
    );

    return updated;
  }

  async listCircleMembers(hostId: string, circleId: string) {
    await this.assertCircleHost(hostId, circleId);

    return this.prisma.circleMember.findMany({
      where: { circleId },
      orderBy: { joinedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profile: {
              select: {
                bio: true,
                city: true,
                interests: true,
                profilePhotoUrl: true,
              },
            },
            trust: { select: { verificationStatus: true } },
          },
        },
      },
    });
  }

  async updateCircleMembership(
    hostId: string,
    circleId: string,
    memberId: string,
    status: 'APPROVED' | 'CANCELLED',
  ) {
    const circle = await this.assertCircleHost(hostId, circleId);
    const member = await this.prisma.circleMember.findUnique({
      where: { id: memberId },
      select: { circleId: true, id: true, status: true, userId: true },
    });

    if (!member || member.circleId !== circleId) {
      throw new NotFoundException('Circle member not found.');
    }

    if (
      member.status !== MembershipStatus.REQUESTED &&
      member.status !== MembershipStatus.APPROVED
    ) {
      throw new BadRequestException(
        'This membership can no longer be updated.',
      );
    }

    const updated = await this.prisma.circleMember.update({
      where: { id: member.id },
      data: { status },
    });
    await this.notifications.createForUser(member.userId, {
      type: NotificationType.CIRCLE_STARTING,
      title:
        status === MembershipStatus.APPROVED
          ? 'Circle request approved'
          : 'Circle request update',
      body:
        status === MembershipStatus.APPROVED
          ? `You are confirmed for ${circle.title}. Cohort chat is now open.`
          : `Your request for ${circle.title} was not approved this time.`,
      metadata: { circleId, membershipId: member.id, status },
    });
    await this.recordAnalytics(
      status === MembershipStatus.APPROVED
        ? 'MEMBERSHIP_APPROVED'
        : 'JOIN_REQUEST_DECLINED',
      { circleId, userId: member.userId },
    );
    this.publishMembershipUpdate(
      hostId,
      member.userId,
      ChatThreadType.CIRCLE,
      circleId,
      member.id,
      status,
    );

    return updated;
  }

  async submitFeedback(
    userId: string,
    eventId: string,
    dto: SubmitFeedbackDto,
  ) {
    const membership = await this.prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true, status: true },
    });

    if (membership?.status !== MembershipStatus.ATTENDED) {
      throw new ForbiddenException(
        'Feedback opens after the host records your attendance.',
      );
    }

    const existingFeedback = await this.prisma.eventFeedback.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true },
    });
    const feedback = await this.prisma.eventFeedback.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: {
        eventId,
        userId,
        rating: dto.rating,
        body: dto.body?.trim(),
      },
      update: {
        rating: dto.rating,
        body: dto.body?.trim() || null,
      },
    });
    if (!existingFeedback) {
      await Promise.all([
        this.recordAnalytics('FEEDBACK_SUBMITTED', { eventId, userId }),
        this.usersService.recordFeedbackSubmitted(userId, eventId),
      ]);
    }
    return feedback;
  }

  async report(userId: string, dto: ReportUserDto) {
    if (!dto.reportedUserId && !dto.eventId && !dto.circleId) {
      throw new BadRequestException(
        'Report must target a user, event, or circle.',
      );
    }

    const report = await this.prisma.userReport.create({
      data: {
        reporterId: userId,
        reportedUserId: dto.reportedUserId,
        eventId: dto.eventId,
        circleId: dto.circleId,
        reason: dto.reason,
        details: dto.details?.trim(),
      },
    });

    await this.notifications.createForUser(userId, {
      type: NotificationType.REPORT_UPDATE,
      title: 'Report received',
      body: 'Niva moderation has received your report.',
      metadata: { reportId: report.id },
    });

    return report;
  }

  async block(userId: string, dto: BlockUserDto) {
    if (userId === dto.blockedUserId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    return this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: dto.blockedUserId,
        },
      },
      create: { blockerId: userId, blockedId: dto.blockedUserId },
      update: {},
    });
  }

  async listBlocks(userId: string) {
    return this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        blocked: {
          select: { id: true, displayName: true, username: true },
        },
      },
    });
  }

  async unblock(userId: string, blockedUserId: string) {
    await this.prisma.userBlock.deleteMany({
      where: { blockedId: blockedUserId, blockerId: userId },
    });

    return { unblocked: true };
  }

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });

    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  async getSettings(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        notificationsEnabled: dto.notificationsEnabled ?? false,
        showProfileInRecommendations: dto.showProfileInRecommendations ?? true,
        allowCircleContinuitySuggestions:
          dto.allowCircleContinuitySuggestions ?? true,
        showInterestsInIcebreakers: dto.showInterestsInIcebreakers ?? true,
      },
      update: {
        notificationsEnabled: dto.notificationsEnabled,
        showProfileInRecommendations: dto.showProfileInRecommendations,
        allowCircleContinuitySuggestions: dto.allowCircleContinuitySuggestions,
        showInterestsInIcebreakers: dto.showInterestsInIcebreakers,
      },
    });
  }

  async upsertEmergencyContact(userId: string, dto: UpsertEmergencyContactDto) {
    return this.prisma.emergencyContact.upsert({
      where: { userId },
      create: {
        userId,
        name: dto.name.trim(),
        relationship: dto.relationship.trim(),
        phone: dto.phone.trim(),
      },
      update: {
        name: dto.name.trim(),
        relationship: dto.relationship.trim(),
        phone: dto.phone.trim(),
      },
    });
  }

  private async assertCanJoin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        communityGuidelinesAccepted: true,
        trust: { select: { verificationStatus: true } },
      },
    });

    if (user?.trust?.verificationStatus !== TrustVerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Complete verification to join events and circles.',
      );
    }

    if (!user.communityGuidelinesAccepted) {
      throw new ForbiddenException(
        'Accept the community guidelines before joining an activity.',
      );
    }
  }

  private async listMutuallyBlockedUserIds(userId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockedId: true, blockerId: true },
    });

    return blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId,
    );
  }

  private async assertCanHost(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firebaseUid: true,
        hostApproval: { select: { status: true } },
        trust: { select: { tier: true, verificationStatus: true } },
      },
    });
    const tier = user?.trust?.tier;
    const allowed =
      tier === TrustTier.TRUSTED ||
      tier === TrustTier.HOST_ELIGIBLE ||
      tier === TrustTier.HOST ||
      this.isVerifiedBetaMember(user);

    if (!allowed) {
      throw new ForbiddenException('Host access requires trusted status.');
    }

    if (user?.hostApproval?.status !== HostApprovalStatus.APPROVED) {
      throw new ForbiddenException(
        'Host access requires approval from the Niva community team.',
      );
    }
  }

  private isVerifiedBetaMember(
    user?: {
      firebaseUid: string;
      trust: { verificationStatus: TrustVerificationStatus } | null;
    } | null,
  ) {
    return (
      process.env.NIVA_BETA_AUTH_ENABLED === 'true' &&
      user?.firebaseUid.startsWith('beta:') === true &&
      user.trust?.verificationStatus === TrustVerificationStatus.VERIFIED
    );
  }

  private async assertChatAccess(
    userId: string,
    type: ChatThreadType,
    activityId: string,
  ) {
    const thread = await this.prisma.chatThread.findFirst({
      where:
        type === ChatThreadType.EVENT
          ? { type, eventId: activityId }
          : { type, circleId: activityId },
      include: {
        circle: { select: { hostId: true } },
        event: { select: { hostId: true } },
      },
    });

    if (!thread) {
      throw new NotFoundException('Cohort chat not found.');
    }

    const hostId =
      type === ChatThreadType.EVENT
        ? thread.event?.hostId
        : thread.circle?.hostId;

    if (hostId === userId) {
      return thread;
    }

    const membership =
      type === ChatThreadType.EVENT
        ? await this.prisma.eventMember.findUnique({
            where: { eventId_userId: { eventId: activityId, userId } },
            select: { status: true },
          })
        : await this.prisma.circleMember.findUnique({
            where: { circleId_userId: { circleId: activityId, userId } },
            select: { status: true },
          });

    if (
      membership?.status !== MembershipStatus.APPROVED &&
      membership?.status !== MembershipStatus.ATTENDED
    ) {
      throw new ForbiddenException(
        'Cohort chat opens after your membership is approved.',
      );
    }

    return thread;
  }

  private publishMembershipUpdate(
    hostId: string,
    memberId: string,
    type: ChatThreadType,
    activityId: string,
    membershipId: string,
    status: MembershipStatus,
  ) {
    const payload = { activityId, membershipId, status, type };
    this.realtime.publishToMember(
      hostId,
      'activity:membership-updated',
      payload,
    );
    this.realtime.publishToMember(
      memberId,
      'activity:membership-updated',
      payload,
    );
  }

  private async assertIcebreakerAccess(
    userId: string,
    type: ChatThreadType,
    activityId: string,
  ) {
    const activity =
      type === ChatThreadType.EVENT
        ? await this.prisma.event.findUnique({
            where: { id: activityId },
            select: { hostId: true },
          })
        : await this.prisma.circle.findUnique({
            where: { id: activityId },
            select: { hostId: true },
          });

    if (activity?.hostId === userId) {
      return;
    }

    const membership =
      type === ChatThreadType.EVENT
        ? await this.prisma.eventMember.findUnique({
            where: { eventId_userId: { eventId: activityId, userId } },
            select: { status: true },
          })
        : await this.prisma.circleMember.findUnique({
            where: { circleId_userId: { circleId: activityId, userId } },
            select: { status: true },
          });

    if (
      membership?.status !== MembershipStatus.APPROVED &&
      membership?.status !== MembershipStatus.ATTENDED
    ) {
      throw new ForbiddenException(
        'Icebreakers are available only to approved activity members.',
      );
    }
  }

  private async assertEventHost(hostId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        endsAt: true,
        hostId: true,
        startsAt: true,
        status: true,
        title: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.hostId !== hostId) {
      throw new ForbiddenException('Only the event host can manage members.');
    }

    return event;
  }

  private async assertCircleHost(hostId: string, circleId: string) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      select: {
        durationWeeks: true,
        hostId: true,
        recurrenceIntervalWeeks: true,
        startsAt: true,
        status: true,
        title: true,
      },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found.');
    }

    if (circle.hostId !== hostId) {
      throw new ForbiddenException('Only the circle host can manage members.');
    }

    return circle;
  }

  private normalizeList(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private normalizeRequiredList(values: string[], label: string) {
    const normalized = this.normalizeList(values);
    if (!normalized.length) {
      throw new BadRequestException(`Add at least one ${label}.`);
    }
    return normalized;
  }

  private parseActivityTime(value: string, label: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Enter a valid ${label}.`);
    }
    return parsed;
  }

  private parseFutureActivityTime(value: string, label: string) {
    const parsed = this.parseActivityTime(value, label);
    if (parsed.getTime() <= Date.now()) {
      throw new BadRequestException(`Choose a future ${label}.`);
    }
    return parsed;
  }

  private buildCircleOccurrences(
    startsAt: Date,
    durationWeeks: number,
    recurrenceIntervalWeeks: number,
  ) {
    const occurrences: Date[] = [];
    const interval = recurrenceIntervalWeeks === 2 ? 2 : 1;

    for (let week = 0; week < durationWeeks; week += interval) {
      const occurrence = new Date(startsAt);
      occurrence.setUTCDate(occurrence.getUTCDate() + week * 7);
      occurrences.push(occurrence);
    }

    return occurrences;
  }

  private assertEventTimeRange(startsAt: Date, endsAt?: Date | null) {
    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestException(
        'The event end time must be after its start time.',
      );
    }
  }

  private sharedInterests(left: string[], right: string[]) {
    const rightByKey = new Map(
      right.map((interest) => [
        interest.trim().toLocaleLowerCase(),
        interest.trim(),
      ]),
    );
    return [...new Set(left.map((interest) => interest.trim()))]
      .filter(Boolean)
      .filter((interest) => rightByKey.has(interest.toLocaleLowerCase()))
      .sort((first, second) => first.localeCompare(second));
  }

  private icebreakerPrompts(
    title: string,
    activityInterests: string[],
    sharedInterests: string[],
  ) {
    const topic = sharedInterests[0] ?? activityInterests[0] ?? 'this activity';
    return [
      `What got you interested in ${topic}?`,
      `Have you tried anything like ${title} before?`,
    ];
  }

  private async recordAnalytics(
    type: string,
    input: {
      circleId?: string;
      eventId?: string;
      metadata?: Record<string, boolean | number | string>;
      userId?: string;
    },
  ) {
    const analytics = this.prisma.productAnalyticsEvent;
    if (!analytics) {
      return;
    }

    await analytics.create({
      data: {
        circleId: input.circleId,
        eventId: input.eventId,
        metadata: input.metadata,
        type,
        userId: input.userId,
      },
    });
  }

  private assertActivityCanBeChanged(status: ActivityStatus) {
    if (status !== ActivityStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only a published activity can be edited or cancelled.',
      );
    }
  }

  private async assertEventCapacity(eventId: string, capacity?: number) {
    if (capacity === undefined) {
      return;
    }

    const memberCount = await this.prisma.eventMember.count({
      where: { eventId, status: { in: activeMembershipStatuses } },
    });
    if (capacity < memberCount) {
      throw new BadRequestException(
        'Capacity cannot be lower than the current member count.',
      );
    }
  }

  private async assertCircleCapacity(circleId: string, capacity?: number) {
    if (capacity === undefined) {
      return;
    }

    const memberCount = await this.prisma.circleMember.count({
      where: { circleId, status: { in: activeMembershipStatuses } },
    });
    if (capacity < memberCount) {
      throw new BadRequestException(
        'Capacity cannot be lower than the current member count.',
      );
    }
  }

  private updatedFields(input: object) {
    return Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
  }

  private async notifyActivityMembers(
    type: 'CIRCLE' | 'EVENT',
    activityId: string,
    title: string,
    metadata: { circleId?: string; eventId?: string; updatedFields: string[] },
  ) {
    const memberIds = await this.activityMemberIds(type, activityId);
    await Promise.all(
      memberIds.map((userId) =>
        this.notifications.createForUser(userId, {
          type: NotificationType.ACTIVITY_UPDATED,
          title: `${type === 'EVENT' ? 'Event' : 'Circle'} details updated`,
          body: `${title} has updated details. Open Niva to review the latest plan.`,
          metadata,
        }),
      ),
    );
  }

  private async notifyActivityCancellation(
    type: 'CIRCLE' | 'EVENT',
    activityId: string,
    title: string,
    reason: string,
  ) {
    const memberIds = await this.activityMemberIds(type, activityId);
    const metadata =
      type === 'EVENT'
        ? { eventId: activityId, reason: reason.trim() }
        : { circleId: activityId, reason: reason.trim() };
    await Promise.all(
      memberIds.map((userId) =>
        this.notifications.createForUser(userId, {
          type: NotificationType.ACTIVITY_CANCELLED,
          title: `${type === 'EVENT' ? 'Event' : 'Circle'} cancelled`,
          body: `${title} was cancelled. ${reason.trim()}`,
          metadata,
        }),
      ),
    );
  }

  private async activityMemberIds(
    type: 'CIRCLE' | 'EVENT',
    activityId: string,
  ) {
    const memberships =
      type === 'EVENT'
        ? await this.prisma.eventMember.findMany({
            where: {
              eventId: activityId,
              status: {
                in: [MembershipStatus.REQUESTED, MembershipStatus.APPROVED],
              },
            },
            select: { userId: true },
          })
        : await this.prisma.circleMember.findMany({
            where: {
              circleId: activityId,
              status: {
                in: [MembershipStatus.REQUESTED, MembershipStatus.APPROVED],
              },
            },
            select: { userId: true },
          });

    return memberships.map((membership) => membership.userId);
  }
}
