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
  HostApprovalStatus,
  ReportStatus,
  VerificationReviewStatus,
} from '@prisma/client';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { AdminAccessGuard } from './admin-access.guard';
import type { RequestWithAdminActor } from './admin-access.guard';
import { AdminKeyGuard } from './admin-key.guard';
import { AdminService } from './admin.service';
import { CancelActivityDto } from './dto/cancel-activity.dto';
import { GrantAdminAccessDto } from './dto/grant-admin-access.dto';
import { ReviewHostApprovalDto } from './dto/review-host-approval.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';

@Controller('admin')
@UseGuards(AdminAccessGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly adminService: AdminService,
    private readonly notifications: NotificationService,
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
  async listVerificationReviews(
    @Query('status') status?: VerificationReviewStatus,
  ) {
    return {
      reviews: await this.usersService.listVerificationReviews(status),
    };
  }

  @Get('verification-reviews/:userId/selfie')
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
  async listReports(@Query('status') status?: ReportStatus) {
    return { reports: await this.adminService.listReports(status) };
  }

  @Patch('reports/:reportId')
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
  async listHostApprovals(@Query('status') status?: HostApprovalStatus) {
    return { approvals: await this.adminService.listHostApprovals(status) };
  }

  @Patch('host-approvals/:userId')
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
  async listActivities(@Query('status') status?: ActivityStatus) {
    return this.adminService.listActivities(status);
  }

  @Post('events/:eventId/cancel')
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
}
