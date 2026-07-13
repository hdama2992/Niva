import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStatus,
  AdminAuditAction,
  AdminRole,
  HostApprovalStatus,
  MembershipStatus,
  NotificationType,
  Prisma,
  ReportStatus,
} from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AdminActor } from './admin-access.guard';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationService,
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

  async listActivities(status: ActivityStatus = ActivityStatus.PUBLISHED) {
    const [events, circles] = await Promise.all([
      this.prisma.event.findMany({
        where: { status },
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
        where: { status },
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
    await this.audit(
      actor,
      AdminAuditAction.ACTIVITY_CANCELLED,
      'circle',
      circleId,
      { reason: reason.trim() },
    );

    return cancelled;
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
}
