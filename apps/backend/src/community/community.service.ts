import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  ChatThreadType,
  HostApprovalStatus,
  MembershipStatus,
  NotificationType,
  TrustTier,
  TrustVerificationStatus,
} from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockUserDto } from './dto/block-user.dto';
import { CreateCircleDto } from './dto/create-circle.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
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
  ) {}

  async listEvents(userId: string, city?: string) {
    const blockedHostIds = await this.listMutuallyBlockedUserIds(userId);

    return this.prisma.event.findMany({
      where: {
        status: ActivityStatus.PUBLISHED,
        city: city ? { equals: city, mode: 'insensitive' } : undefined,
        hostId: blockedHostIds.length ? { notIn: blockedHostIds } : undefined,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        host: { select: { id: true, displayName: true, username: true } },
        _count: {
          select: {
            members: {
              where: { status: { in: activeMembershipStatuses } },
            },
          },
        },
      },
    });
  }

  async listCircles(userId: string, city?: string) {
    const blockedHostIds = await this.listMutuallyBlockedUserIds(userId);

    return this.prisma.circle.findMany({
      where: {
        status: ActivityStatus.PUBLISHED,
        city: city ? { equals: city, mode: 'insensitive' } : undefined,
        hostId: blockedHostIds.length ? { notIn: blockedHostIds } : undefined,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        host: { select: { id: true, displayName: true, username: true } },
        _count: {
          select: {
            members: {
              where: { status: { in: activeMembershipStatuses } },
            },
          },
        },
      },
    });
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    await this.assertCanHost(userId);

    return this.prisma.event.create({
      data: {
        hostId: userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        city: dto.city.trim(),
        locationName: dto.locationName.trim(),
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        capacity: dto.capacity,
        difficulty: dto.difficulty,
        interests: this.normalizeList(dto.interests),
        chatThread: {
          create: { type: 'EVENT' },
        },
      },
      include: { chatThread: true },
    });
  }

  async createCircle(userId: string, dto: CreateCircleDto) {
    await this.assertCanHost(userId);

    return this.prisma.circle.create({
      data: {
        hostId: userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        city: dto.city.trim(),
        locationName: dto.locationName.trim(),
        startsAt: new Date(dto.startsAt),
        schedule: dto.schedule.trim(),
        durationWeeks: dto.durationWeeks,
        capacity: dto.capacity,
        difficulty: dto.difficulty,
        interests: this.normalizeList(dto.interests),
        chatThread: {
          create: { type: ChatThreadType.CIRCLE },
        },
      },
      include: { chatThread: true },
    });
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.assertEventHost(userId, eventId);
    this.assertActivityCanBeChanged(event.status);
    await this.assertEventCapacity(eventId, dto.capacity);

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        capacity: dto.capacity,
        city: dto.city?.trim(),
        description: dto.description?.trim(),
        difficulty: dto.difficulty,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        interests: dto.interests
          ? this.normalizeList(dto.interests)
          : undefined,
        locationName: dto.locationName?.trim(),
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        title: dto.title?.trim(),
      },
    });

    await this.notifyActivityMembers('EVENT', eventId, updated.title, {
      eventId,
      updatedFields: this.updatedFields(dto),
    });

    return updated;
  }

  async updateCircle(userId: string, circleId: string, dto: UpdateCircleDto) {
    const circle = await this.assertCircleHost(userId, circleId);
    this.assertActivityCanBeChanged(circle.status);
    await this.assertCircleCapacity(circleId, dto.capacity);

    const updated = await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        capacity: dto.capacity,
        city: dto.city?.trim(),
        description: dto.description?.trim(),
        difficulty: dto.difficulty,
        durationWeeks: dto.durationWeeks,
        interests: dto.interests
          ? this.normalizeList(dto.interests)
          : undefined,
        locationName: dto.locationName?.trim(),
        schedule: dto.schedule?.trim(),
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        title: dto.title?.trim(),
      },
    });

    await this.notifyActivityMembers('CIRCLE', circleId, updated.title, {
      circleId,
      updatedFields: this.updatedFields(dto),
    });

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
    const [events, circles] = await Promise.all([
      this.prisma.eventMember.findMany({
        where: { userId },
        orderBy: { joinedAt: 'desc' },
        include: { event: true },
      }),
      this.prisma.circleMember.findMany({
        where: { userId },
        orderBy: { joinedAt: 'desc' },
        include: { circle: true },
      }),
    ]);

    return { events, circles };
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

    return this.prisma.chatMessage.create({
      data: { threadId: thread.id, senderId: userId, body: trimmedBody },
      include: {
        sender: {
          select: { id: true, displayName: true, username: true },
        },
      },
    });
  }

  async requestHostApproval(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trust: { select: { tier: true } } },
    });
    const tier = user?.trust?.tier;
    const eligible =
      tier === TrustTier.TRUSTED ||
      tier === TrustTier.HOST_ELIGIBLE ||
      tier === TrustTier.HOST;

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
            profile: { select: { interests: true } },
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
            profile: { select: { interests: true } },
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

    return updated;
  }

  async submitFeedback(
    userId: string,
    eventId: string,
    dto: SubmitFeedbackDto,
  ) {
    const membership = await this.prisma.eventMember.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('Join the event before leaving feedback.');
    }

    return this.prisma.eventFeedback.upsert({
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
        notificationsEnabled: dto.notificationsEnabled ?? true,
        showProfileInRecommendations: dto.showProfileInRecommendations ?? true,
        allowCircleContinuitySuggestions:
          dto.allowCircleContinuitySuggestions ?? true,
      },
      update: {
        notificationsEnabled: dto.notificationsEnabled,
        showProfileInRecommendations: dto.showProfileInRecommendations,
        allowCircleContinuitySuggestions: dto.allowCircleContinuitySuggestions,
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
        hostApproval: { select: { status: true } },
        trust: { select: { tier: true } },
      },
    });
    const tier = user?.trust?.tier;
    const allowed =
      tier === TrustTier.TRUSTED ||
      tier === TrustTier.HOST_ELIGIBLE ||
      tier === TrustTier.HOST;

    if (!allowed) {
      throw new ForbiddenException('Host access requires trusted status.');
    }

    if (user?.hostApproval?.status !== HostApprovalStatus.APPROVED) {
      throw new ForbiddenException(
        'Host access requires approval from the Niva community team.',
      );
    }
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

  private async assertEventHost(hostId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { hostId: true, status: true, title: true },
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
      select: { hostId: true, status: true, title: true },
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
