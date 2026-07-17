import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ActivityStatus,
  AdminAuditAction,
  AdminRole,
  HostApprovalStatus,
  ReportStatus,
  VerificationReviewStatus,
} from '@prisma/client';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { TrustMaintenanceService } from '../users/trust-maintenance.service';
import { AdminAccessGuard } from './admin-access.guard';
import type { RequestWithAdminActor } from './admin-access.guard';
import { AdminKeyGuard } from './admin-key.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminRoles } from './admin-roles.decorator';
import { AdminService } from './admin.service';
import { CancelActivityDto } from './dto/cancel-activity.dto';
import { GrantAdminAccessDto } from './dto/grant-admin-access.dto';
import { ReviewHostApprovalDto } from './dto/review-host-approval.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { UpdateActivityLocationDto } from './dto/update-activity-location.dto';
import { ReviewAccountDeletionDto } from './dto/review-account-deletion.dto';
import { ReviewBetaAccessDto } from './dto/review-beta-access.dto';

@Controller('admin')
@UseGuards(AdminAccessGuard, AdminRoleGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly adminService: AdminService,
    private readonly notifications: NotificationService,
    private readonly trustMaintenance: TrustMaintenanceService,
  ) {}

  @Get('me')
  getAdminIdentity(@Req() request: RequestWithAdminActor) {
    return { admin: request.adminActor };
  }

  @Post('access')
  @UseGuards(AdminKeyGuard)
  async grantAccess(
    @Req() request: RequestWithAdminActor,
    @Body() body: GrantAdminAccessDto,
  ) {
    return {
      access: await this.adminService.grantAccess(
        request.adminActor ?? { label: 'bootstrap-key' },
        body.userId,
        body.role,
      ),
    };
  }

  @Get('verification-reviews')
  @AdminRoles(
    AdminRole.REVIEWER,
    AdminRole.MODERATOR,
    AdminRole.COMMUNITY_MANAGER,
  )
  async listVerificationReviews(
    @Query('status') status?: VerificationReviewStatus,
  ) {
    return {
      reviews: await this.usersService.listVerificationReviews(status),
    };
  }

  @Get('verification-reviews/:userId/selfie')
  @AdminRoles(
    AdminRole.REVIEWER,
    AdminRole.MODERATOR,
    AdminRole.COMMUNITY_MANAGER,
  )
  async getVerificationSelfie(@Param('userId') userId: string) {
    const storagePath =
      await this.usersService.getVerificationSelfieStoragePath(userId);

    return {
      url: await this.firebaseAdminService.createPrivateSelfieViewerUrl(
        storagePath,
      ),
    };
  }

  @Patch('verification-reviews/:userId')
  @AdminRoles(
    AdminRole.REVIEWER,
    AdminRole.MODERATOR,
    AdminRole.COMMUNITY_MANAGER,
  )
  async reviewVerification(
    @Param('userId') userId: string,
    @Body() body: ReviewVerificationDto,
    @Req() request: RequestWithAdminActor,
  ) {
    const result = await this.usersService.reviewSelfie(
      userId,
      body.status,
      request.adminActor.userId ?? request.adminActor.label,
      body.reason,
    );
    await this.adminService.audit(
      request.adminActor,
      AdminAuditAction.VERIFICATION_REVIEWED,
      'verificationReview',
      userId,
      { reason: body.reason, status: body.status },
    );
    return result;
  }

  @Get('reports')
  @AdminRoles(AdminRole.MODERATOR, AdminRole.COMMUNITY_MANAGER)
  async listReports(@Query('status') status?: ReportStatus) {
    return { reports: await this.adminService.listReports(status) };
  }

  @Get('account-deletion-requests')
  @AdminRoles(AdminRole.MODERATOR, AdminRole.COMMUNITY_MANAGER)
  async listAccountDeletionRequests(@Query('status') status?: string) {
    return {
      requests: await this.adminService.listAccountDeletionRequests(status),
    };
  }

  @Get('beta-access-requests')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async listBetaAccessRequests(@Query('status') status?: string) {
    return {
      requests: await this.adminService.listBetaAccessRequests(status),
    };
  }

  @Patch('beta-access-requests/:requestId')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async reviewBetaAccessRequest(
    @Param('requestId') requestId: string,
    @Body() body: ReviewBetaAccessDto,
  ) {
    return {
      request: await this.adminService.reviewBetaAccessRequest(
        requestId,
        body.status,
      ),
    };
  }

  @Patch('account-deletion-requests/:requestId')
  @AdminRoles(AdminRole.MODERATOR, AdminRole.COMMUNITY_MANAGER)
  async reviewAccountDeletionRequest(
    @Req() request: RequestWithAdminActor,
    @Param('requestId') requestId: string,
    @Body() body: ReviewAccountDeletionDto,
  ) {
    return {
      request: await this.adminService.reviewAccountDeletionRequest(
        request.adminActor,
        requestId,
        body.status,
      ),
    };
  }

  @Patch('reports/:reportId')
  @AdminRoles(AdminRole.MODERATOR, AdminRole.COMMUNITY_MANAGER)
  async reviewReport(
    @Req() request: RequestWithAdminActor,
    @Param('reportId') reportId: string,
    @Body() body: ReviewReportDto,
  ) {
    return {
      report: await this.adminService.updateReport(
        request.adminActor,
        reportId,
        body,
      ),
    };
  }

  @Get('host-approvals')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async listHostApprovals(@Query('status') status?: HostApprovalStatus) {
    return { approvals: await this.adminService.listHostApprovals(status) };
  }

  @Patch('host-approvals/:userId')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async reviewHostApproval(
    @Req() request: RequestWithAdminActor,
    @Param('userId') userId: string,
    @Body() body: ReviewHostApprovalDto,
  ) {
    return {
      approval: await this.adminService.updateHostApproval(
        request.adminActor,
        userId,
        body,
      ),
    };
  }

  @Get('activities')
  @AdminRoles(
    AdminRole.REVIEWER,
    AdminRole.MODERATOR,
    AdminRole.COMMUNITY_MANAGER,
  )
  async listActivities(
    @Query('status') status?: ActivityStatus,
    @Query('q') query?: string,
    @Query('city') city?: string,
  ) {
    return this.adminService.listActivities(status, query, city);
  }

  @Get('members')
  @AdminRoles(
    AdminRole.REVIEWER,
    AdminRole.MODERATOR,
    AdminRole.COMMUNITY_MANAGER,
  )
  async listMembers(
    @Query('q') query?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
  ) {
    return {
      members: await this.adminService.listMembers(query, city, limit),
    };
  }

  @Get('analytics/summary')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async getAnalyticsSummary() {
    return { analytics: await this.adminService.getAnalyticsSummary() };
  }

  @Post('events/:eventId/cancel')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async cancelEvent(
    @Req() request: RequestWithAdminActor,
    @Param('eventId') eventId: string,
    @Body() body: CancelActivityDto,
  ) {
    return {
      event: await this.adminService.cancelEvent(
        request.adminActor,
        eventId,
        body.reason,
      ),
    };
  }

  @Post('circles/:circleId/cancel')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async cancelCircle(
    @Req() request: RequestWithAdminActor,
    @Param('circleId') circleId: string,
    @Body() body: CancelActivityDto,
  ) {
    return {
      circle: await this.adminService.cancelCircle(
        request.adminActor,
        circleId,
        body.reason,
      ),
    };
  }

  @Post('notification-deliveries/dispatch')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async dispatchPendingNotifications(@Req() request: RequestWithAdminActor) {
    const dispatch = await this.notifications.dispatchPending();
    await this.adminService.audit(
      request.adminActor,
      AdminAuditAction.NOTIFICATION_DELIVERY_DISPATCHED,
      'notificationDelivery',
      'batch',
      dispatch,
    );
    return { dispatch };
  }

  @Post('trust/recalculate')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async recalculateTrust(@Req() request: RequestWithAdminActor) {
    const result = await this.trustMaintenance.recalculate();
    await this.adminService.audit(
      request.adminActor,
      AdminAuditAction.TRUST_RECALCULATED,
      'trustProfile',
      'all',
      result,
    );
    return result;
  }

  @Patch('events/:eventId/location')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async updateEventLocation(
    @Req() request: RequestWithAdminActor,
    @Param('eventId') eventId: string,
    @Body() body: UpdateActivityLocationDto,
  ) {
    return {
      event: await this.adminService.updateEventLocation(
        request.adminActor,
        eventId,
        body,
      ),
    };
  }

  @Patch('circles/:circleId/location')
  @AdminRoles(AdminRole.COMMUNITY_MANAGER)
  async updateCircleLocation(
    @Req() request: RequestWithAdminActor,
    @Param('circleId') circleId: string,
    @Body() body: UpdateActivityLocationDto,
  ) {
    return {
      circle: await this.adminService.updateCircleLocation(
        request.adminActor,
        circleId,
        body,
      ),
    };
  }
}
