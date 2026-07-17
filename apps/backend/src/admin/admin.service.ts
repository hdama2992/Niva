import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  AdminAuditAction,
  AdminRole,
  ChatThreadType,
  HostApprovalStatus,
  MembershipStatus,
  NotificationType,
  Prisma,
  ReportStatus,
} from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { UsersService } from '../users/users.service';
import { AdminActor } from './admin-access.guard';
import { UpdateActivityLocationDto } from './dto/update-activity-location.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationService,
    private readonly realtime: RealtimeService,
  ) {}

  async grantAccess(actor: AdminActor, userId: string, role: AdminRole) {
    const access = await this.prisma.adminAccess.upsert({
      where: { userId },
      create: { userId, role, isActive: true },
      update: { role, isActive: true },
    });
    await this.audit(
      actor,
      AdminAuditAction.ADMIN_ACCESS_GRANTED,
      'user',
      userId,
      {
        role,
      },
    );
    return access;
  }

  async listReports(status?: ReportStatus) {
    return this.prisma.userReport.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        event: { select: { id: true, title: true } },
        circle: { select: { id: true, title: true } },
        reportedUser: {
          select: { id: true, displayName: true, username: true },
        },
        reporter: { select: { id: true, displayName: true, username: true } },
      },
    });
  }

  async updateReport(
    actor: AdminActor,
    reportId: string,
    input: { confirmed: boolean; status: ReportStatus },
  ) {
    const report = await this.prisma.userReport.findUnique({
      where: { id: reportId },
      select: { id: true, reportedUserId: true, reporterId: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    const updated = await this.prisma.userReport.update({
      where: { id: reportId },
      data: { status: input.status },
    });

    if (input.confirmed && report.reportedUserId) {
      await this.usersService.recordConfirmedReport(
        report.reportedUserId,
        report.id,
      );
    }

    await this.notifications.createForUser(report.reporterId, {
      type: 'REPORT_UPDATE',
      title: 'Report update',
      body: `Your report has been marked ${input.status.toLowerCase()}.`,
      metadata: { reportId, status: input.status },
    });
    await this.audit(
      actor,
      AdminAuditAction.REPORT_STATUS_CHANGED,
      'report',
      reportId,
      {
        confirmed: input.confirmed,
        status: input.status,
      },
    );

    return updated;
  }

  async listHostApprovals(status?: HostApprovalStatus) {
    return this.prisma.hostApproval.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profile: { select: { city: true, interests: true } },
            trust: { select: { score: true, tier: true } },
          },
        },
      },
    });
  }

  async updateHostApproval(
    actor: AdminActor,
    userId: string,
    input: {
      reason?: string;
      status: Exclude<HostApprovalStatus, 'NOT_REQUESTED' | 'PENDING'>;
    },
  ) {
    const approval = await this.prisma.hostApproval.upsert({
      where: { userId },
      create: {
        userId,
        status: input.status,
        reason: input.reason?.trim() || null,
        reviewerId: actor.userId ?? actor.label,
        requestedAt: new Date(),
        reviewedAt: new Date(),
      },
      update: {
        status: input.status,
        reason: input.reason?.trim() || null,
        reviewerId: actor.userId ?? actor.label,
        reviewedAt: new Date(),
      },
    });

    await this.notifications.createForUser(userId, {
      type: 'HOST_APPROVAL_UPDATE',
      title:
        input.status === HostApprovalStatus.APPROVED
          ? 'Host access approved'
          : 'Host access update',
      body:
        input.status === HostApprovalStatus.APPROVED
          ? 'You can now create and manage Niva events.'
          : 'Your host access request needs more work before approval.',
      metadata: { hostApprovalStatus: input.status },
    });
    await this.audit(
      actor,
      AdminAuditAction.HOST_APPROVAL_CHANGED,
      'hostApproval',
      userId,
      {
        reason: input.reason,
        status: input.status,
      },
    );

    return approval;
  }

  async listActivities(
    status: ActivityStatus = ActivityStatus.PUBLISHED,
    query?: string,
    city?: string,
  ) {
    const normalizedQuery = query?.trim();
    const normalizedCity = city?.trim();
    const activityFilter = {
      OR: normalizedQuery
        ? [
            {
              title: {
                contains: normalizedQuery,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              locationName: {
                contains: normalizedQuery,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ]
        : undefined,
      city: normalizedCity
        ? { equals: normalizedCity, mode: Prisma.QueryMode.insensitive }
        : undefined,
      status,
    };
    const [events, circles] = await Promise.all([
      this.prisma.event.findMany({
        where: activityFilter,
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          title: true,
          city: true,
          locationName: true,
          startsAt: true,
          host: { select: { displayName: true, username: true } },
        },
      }),
      this.prisma.circle.findMany({
        where: activityFilter,
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          title: true,
          city: true,
          locationName: true,
          startsAt: true,
          schedule: true,
          host: { select: { displayName: true, username: true } },
        },
      }),
    ]);

    return { circles, events };
  }

  async listMembers(query?: string, city?: string, limit?: string) {
    const normalizedQuery = query?.trim();
    const normalizedCity = city?.trim();
    const parsedLimit = Number.parseInt(limit ?? '', 10);
    const take = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 20;

    return this.prisma.user.findMany({
      where: {
        OR: normalizedQuery
          ? [
              {
                displayName: {
                  contains: normalizedQuery,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                username: {
                  contains: normalizedQuery,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                email: {
                  contains: normalizedQuery,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                phone: { contains: normalizedQuery },
              },
              {
                profile: {
                  is: {
                    city: {
                      contains: normalizedQuery,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                },
              },
            ]
          : undefined,
        profile: normalizedCity
          ? {
              is: {
                city: {
                  equals: normalizedCity,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            }
          : undefined,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        createdAt: true,
        displayName: true,
        email: true,
        id: true,
        profile: {
          select: {
            city: true,
            interests: true,
            profileCompleteness: true,
          },
        },
        selfieVerification: { select: { status: true } },
        trust: {
          select: { score: true, tier: true, verificationStatus: true },
        },
        username: true,
        phone: true,
      },
      take,
    });
  }

  async getAnalyticsSummary() {
    const [analyticsByType, attendedMemberships, continuityPreferences] =
      await Promise.all([
        this.prisma.productAnalyticsEvent.groupBy({
          by: ['type'],
          _count: { _all: true },
        }),
        this.prisma.eventMember.findMany({
          where: { status: MembershipStatus.ATTENDED },
          select: { userId: true },
        }),
        this.prisma.continuityPreference.count(),
      ]);

    const counts = Object.fromEntries(
      analyticsByType.map((entry) => [entry.type, entry._count._all]),
    ) as Record<string, number>;
    const attendanceByUser = new Map<string, number>();
    for (const membership of attendedMemberships) {
      attendanceByUser.set(
        membership.userId,
        (attendanceByUser.get(membership.userId) ?? 0) + 1,
      );
    }

    return {
      attendanceRecorded: counts.ATTENDANCE_RECORDED ?? 0,
      continuityPreferences,
      feedbackSubmitted: counts.FEEDBACK_SUBMITTED ?? 0,
      icebreakersViewed: counts.ICEBREAKER_VIEWED ?? 0,
      joinRequests: counts.JOIN_REQUESTED ?? 0,
      membershipApprovals: counts.MEMBERSHIP_APPROVED ?? 0,
      recommendationViews: counts.RECOMMENDATIONS_VIEWED ?? 0,
      repeatParticipants: [...attendanceByUser.values()].filter(
        (attendanceCount) => attendanceCount > 1,
      ).length,
    };
  }

  async listAccountDeletionRequests(status = 'PENDING') {
    return this.prisma.accountDeletionRequest.findMany({
      where: status === 'ALL' ? undefined : { status },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async listBetaAccessRequests(status = 'PENDING') {
    return this.prisma.betaAccessRequest.findMany({
      where: status === 'ALL' ? undefined : { status },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async reviewBetaAccessRequest(
    requestId: string,
    status: 'DECLINED' | 'INVITED',
  ) {
    const updated = await this.prisma.betaAccessRequest.updateMany({
      where: { id: requestId },
      data: { status },
    });
    if (updated.count !== 1) {
      throw new NotFoundException('Beta access request not found.');
    }
    return this.prisma.betaAccessRequest.findUnique({
      where: { id: requestId },
    });
  }

  async reviewAccountDeletionRequest(
    actor: AdminActor,
    requestId: string,
    status: 'IN_REVIEW' | 'COMPLETED' | 'REJECTED',
  ) {
    const request = await this.prisma.accountDeletionRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Account deletion request not found.');
    }

    const updated = await this.prisma.accountDeletionRequest.update({
      where: { id: requestId },
      data: { status },
    });
    await this.audit(
      actor,
      AdminAuditAction.ACCOUNT_DELETION_REQUEST_UPDATED,
      'accountDeletionRequest',
      requestId,
      { identifier: request.identifier, status },
    );
    return updated;
  }

  async cancelEvent(actor: AdminActor, eventId: string, reason: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, status: true, title: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    this.assertPublishedActivity(event.status);

    const cancelled = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        cancelledAt: new Date(),
        cancellationReason: reason.trim(),
        status: ActivityStatus.CANCELLED,
      },
    });
    await this.notifyEventCancellation(eventId, cancelled.title, reason);
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
    await this.audit(
      actor,
      AdminAuditAction.ACTIVITY_CANCELLED,
      'event',
      eventId,
      {
        reason: reason.trim(),
      },
    );

    return cancelled;
  }

  async updateEventLocation(
    actor: AdminActor,
    eventId: string,
    input: UpdateActivityLocationDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { city: true, id: true, status: true, title: true },
    });
    if (!event) {
      throw new NotFoundException('Event not found.');
    }
    this.assertPublishedActivity(event.status);

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        city: input.city?.trim() || event.city,
        locationName: input.locationName.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });
    await this.notifyEventLocationUpdate(
      eventId,
      updated.title,
      updated.locationName,
      updated.city,
    );
    this.realtime.publishToCohort(
      ChatThreadType.EVENT,
      eventId,
      'cohort:activity-updated',
      { activityId: eventId, type: ChatThreadType.EVENT },
    );
    await this.audit(
      actor,
      AdminAuditAction.ACTIVITY_LOCATION_UPDATED,
      'event',
      eventId,
      { city: updated.city, locationName: updated.locationName },
    );

    return updated;
  }

  async cancelCircle(actor: AdminActor, circleId: string, reason: string) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      select: { id: true, status: true, title: true },
    });
    if (!circle) {
      throw new NotFoundException('Circle not found.');
    }
    this.assertPublishedActivity(circle.status);

    const cancelled = await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        cancelledAt: new Date(),
        cancellationReason: reason.trim(),
        status: ActivityStatus.CANCELLED,
      },
    });
    await this.notifyCircleCancellation(circleId, cancelled.title, reason);
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
    await this.audit(
      actor,
      AdminAuditAction.ACTIVITY_CANCELLED,
      'circle',
      circleId,
      { reason: reason.trim() },
    );

    return cancelled;
  }

  async updateCircleLocation(
    actor: AdminActor,
    circleId: string,
    input: UpdateActivityLocationDto,
  ) {
    const circle = await this.prisma.circle.findUnique({
      where: { id: circleId },
      select: { city: true, id: true, status: true, title: true },
    });
    if (!circle) {
      throw new NotFoundException('Circle not found.');
    }
    this.assertPublishedActivity(circle.status);

    const updated = await this.prisma.circle.update({
      where: { id: circleId },
      data: {
        city: input.city?.trim() || circle.city,
        locationName: input.locationName.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
      },
    });
    await this.notifyCircleLocationUpdate(
      circleId,
      updated.title,
      updated.locationName,
      updated.city,
    );
    this.realtime.publishToCohort(
      ChatThreadType.CIRCLE,
      circleId,
      'cohort:activity-updated',
      { activityId: circleId, type: ChatThreadType.CIRCLE },
    );
    await this.audit(
      actor,
      AdminAuditAction.ACTIVITY_LOCATION_UPDATED,
      'circle',
      circleId,
      { city: updated.city, locationName: updated.locationName },
    );

    return updated;
  }

  async audit(
    actor: AdminActor,
    action: AdminAuditAction,
    targetType: string,
    targetId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.adminAuditLog.create({
      data: {
        actorUserId: actor.userId,
        actorLabel: actor.label,
        action,
        targetType,
        targetId,
        metadata,
      },
    });
  }

  private assertPublishedActivity(status: ActivityStatus) {
    if (status !== ActivityStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only a published activity can be cancelled.',
      );
    }
  }

  private async notifyEventCancellation(
    eventId: string,
    title: string,
    reason: string,
  ) {
    const members = await this.prisma.eventMember.findMany({
      where: {
        eventId,
        status: { in: [MembershipStatus.REQUESTED, MembershipStatus.APPROVED] },
      },
      select: { userId: true },
    });
    await Promise.all(
      members.map((member) =>
        this.notifications.createForUser(member.userId, {
          type: NotificationType.ACTIVITY_CANCELLED,
          title: 'Event cancelled',
          body: `${title} was cancelled. ${reason.trim()}`,
          metadata: { eventId, reason: reason.trim() },
        }),
      ),
    );
  }

  private async notifyEventLocationUpdate(
    eventId: string,
    title: string,
    locationName: string,
    city: string,
  ) {
    const members = await this.prisma.eventMember.findMany({
      where: {
        eventId,
        status: { in: [MembershipStatus.REQUESTED, MembershipStatus.APPROVED] },
      },
      select: { userId: true },
    });
    await Promise.all(
      members.map((member) =>
        this.notifications.createForUser(member.userId, {
          type: NotificationType.HOST_UPDATED_LOCATION,
          title: 'Event location updated',
          body: `${title} is now at ${locationName}, ${city}.`,
          metadata: { city, eventId, locationName },
        }),
      ),
    );
  }

  private async notifyCircleCancellation(
    circleId: string,
    title: string,
    reason: string,
  ) {
    const members = await this.prisma.circleMember.findMany({
      where: {
        circleId,
        status: { in: [MembershipStatus.REQUESTED, MembershipStatus.APPROVED] },
      },
      select: { userId: true },
    });
    await Promise.all(
      members.map((member) =>
        this.notifications.createForUser(member.userId, {
          type: NotificationType.ACTIVITY_CANCELLED,
          title: 'Circle cancelled',
          body: `${title} was cancelled. ${reason.trim()}`,
          metadata: { circleId, reason: reason.trim() },
        }),
      ),
    );
  }

  private async notifyCircleLocationUpdate(
    circleId: string,
    title: string,
    locationName: string,
    city: string,
  ) {
    const members = await this.prisma.circleMember.findMany({
      where: {
        circleId,
        status: { in: [MembershipStatus.REQUESTED, MembershipStatus.APPROVED] },
      },
      select: { userId: true },
    });
    await Promise.all(
      members.map((member) =>
        this.notifications.createForUser(member.userId, {
          type: NotificationType.HOST_UPDATED_LOCATION,
          title: 'Circle location updated',
          body: `${title} is now at ${locationName}, ${city}.`,
          metadata: { circleId, city, locationName },
        }),
      ),
    );
  }
}
