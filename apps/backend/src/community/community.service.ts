import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  MembershipStatus,
  NotificationType,
  Prisma,
  TrustTier,
  TrustVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockUserDto } from './dto/block-user.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpsertEmergencyContactDto } from './dto/upsert-emergency-contact.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async listEvents(city?: string) {
    return this.prisma.event.findMany({
      where: {
        status: ActivityStatus.PUBLISHED,
        city: city ? { equals: city, mode: 'insensitive' } : undefined,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        host: { select: { id: true, displayName: true, username: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async listCircles(city?: string) {
    return this.prisma.circle.findMany({
      where: {
        status: ActivityStatus.PUBLISHED,
        city: city ? { equals: city, mode: 'insensitive' } : undefined,
      },
      orderBy: { startsAt: 'asc' },
      include: {
        host: { select: { id: true, displayName: true, username: true } },
        _count: { select: { members: true } },
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

  async joinEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, requiresVerification: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.requiresVerification) {
      await this.assertCanJoin(userId);
    }

    const membership = await this.prisma.eventMember.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId },
      update: { status: MembershipStatus.REQUESTED },
      include: { event: true },
    });

    await this.createNotification(userId, {
      type: NotificationType.JOIN_REQUEST_ACCEPTED,
      title: 'Join request received',
      body: `Your request for ${event.title} is ready for host review.`,
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
      select: { id: true, title: true, requiresVerification: true },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found.');
    }

    if (circle.requiresVerification) {
      await this.assertCanJoin(userId);
    }

    const membership = await this.prisma.circleMember.upsert({
      where: { circleId_userId: { circleId, userId } },
      create: { circleId, userId },
      update: { status: MembershipStatus.REQUESTED },
      include: { circle: true },
    });

    await this.createNotification(userId, {
      type: NotificationType.CIRCLE_STARTING,
      title: 'Circle request received',
      body: `Your request for ${circle.title} is ready for host review.`,
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

    await this.createNotification(userId, {
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
      select: { trust: { select: { verificationStatus: true } } },
    });

    if (user?.trust?.verificationStatus !== TrustVerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Complete verification to join events and circles.',
      );
    }
  }

  private async assertCanHost(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trust: { select: { tier: true } } },
    });
    const tier = user?.trust?.tier;
    const allowed =
      tier === TrustTier.TRUSTED ||
      tier === TrustTier.HOST_ELIGIBLE ||
      tier === TrustTier.HOST;

    if (!allowed) {
      throw new ForbiddenException('Host access requires trusted status.');
    }
  }

  private async createNotification(
    userId: string,
    input: {
      type: NotificationType;
      title: string;
      body: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
      },
    });
  }

  private normalizeList(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }
}
