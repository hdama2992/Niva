import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ChatThreadType } from '@prisma/client';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import { NotificationService } from '../notifications/notification.service';
import type { RequestWithFirebaseUser } from '../firebase/firebase-auth.guard';
import {
  firebaseTokenToSessionInput,
  UsersService,
} from '../users/users.service';
import { CommunityService } from './community.service';
import { BlockUserDto } from './dto/block-user.dto';
import { CancelActivityDto } from './dto/cancel-activity.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateCircleDto } from './dto/create-circle.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { UpdateContinuityPreferenceDto } from './dto/update-continuity-preference.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpsertEmergencyContactDto } from './dto/upsert-emergency-contact.dto';

@Controller('community')
@UseGuards(FirebaseAuthGuard)
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly usersService: UsersService,
    private readonly notifications: NotificationService,
  ) {}

  @Get('events')
  async listEvents(
    @Req() request: RequestWithFirebaseUser,
    @Query('city') city?: string,
  ) {
    const userId = await this.currentUserId(request);

    return { events: await this.communityService.listEvents(userId, city) };
  }

  @Post('events')
  async createEvent(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: CreateEventDto,
  ) {
    const userId = await this.currentUserId(request);

    return { event: await this.communityService.createEvent(userId, body) };
  }

  @Patch('events/:eventId')
  async updateEvent(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
    @Body() body: UpdateEventDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      event: await this.communityService.updateEvent(userId, eventId, body),
    };
  }

  @Post('events/:eventId/cancel')
  async cancelEvent(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
    @Body() body: CancelActivityDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      event: await this.communityService.cancelEvent(
        userId,
        eventId,
        body.reason,
      ),
    };
  }

  @Post('events/:eventId/join')
  async joinEvent(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
  ) {
    const userId = await this.currentUserId(request);

    return {
      membership: await this.communityService.joinEvent(userId, eventId),
    };
  }

  @Post('events/:eventId/leave')
  async leaveEvent(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
  ) {
    const userId = await this.currentUserId(request);

    return this.communityService.leaveEvent(userId, eventId);
  }

  @Post('events/:eventId/feedback')
  async submitFeedback(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
    @Body() body: SubmitFeedbackDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      feedback: await this.communityService.submitFeedback(
        userId,
        eventId,
        body,
      ),
    };
  }

  @Patch('events/:eventId/continuity-preference')
  async updateContinuityPreference(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
    @Body() body: UpdateContinuityPreferenceDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      preference: await this.communityService.updateContinuityPreference(
        userId,
        eventId,
        body,
      ),
    };
  }

  @Get('events/:eventId/feedback-insights')
  async getEventFeedbackInsights(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
  ) {
    const userId = await this.currentUserId(request);

    return {
      insights: await this.communityService.getEventFeedbackInsights(
        userId,
        eventId,
      ),
    };
  }

  @Patch('events/:eventId/members/:memberId/attendance')
  async updateEventAttendance(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateAttendanceDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      membership: await this.communityService.updateEventAttendance(
        userId,
        eventId,
        memberId,
        body.status,
      ),
    };
  }

  @Get('events/:eventId/members')
  async listEventMembers(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
  ) {
    const userId = await this.currentUserId(request);

    return {
      members: await this.communityService.listEventMembers(userId, eventId),
    };
  }

  @Patch('events/:eventId/members/:memberId')
  async updateEventMembership(
    @Req() request: RequestWithFirebaseUser,
    @Param('eventId') eventId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMembershipDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      membership: await this.communityService.updateEventMembership(
        userId,
        eventId,
        memberId,
        body.status,
      ),
    };
  }

  @Get('circles')
  async listCircles(
    @Req() request: RequestWithFirebaseUser,
    @Query('city') city?: string,
  ) {
    const userId = await this.currentUserId(request);

    return { circles: await this.communityService.listCircles(userId, city) };
  }

  @Post('circles')
  async createCircle(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: CreateCircleDto,
  ) {
    const userId = await this.currentUserId(request);

    return { circle: await this.communityService.createCircle(userId, body) };
  }

  @Patch('circles/:circleId')
  async updateCircle(
    @Req() request: RequestWithFirebaseUser,
    @Param('circleId') circleId: string,
    @Body() body: UpdateCircleDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      circle: await this.communityService.updateCircle(userId, circleId, body),
    };
  }

  @Post('circles/:circleId/cancel')
  async cancelCircle(
    @Req() request: RequestWithFirebaseUser,
    @Param('circleId') circleId: string,
    @Body() body: CancelActivityDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      circle: await this.communityService.cancelCircle(
        userId,
        circleId,
        body.reason,
      ),
    };
  }

  @Post('circles/:circleId/join')
  async joinCircle(
    @Req() request: RequestWithFirebaseUser,
    @Param('circleId') circleId: string,
  ) {
    const userId = await this.currentUserId(request);

    return {
      membership: await this.communityService.joinCircle(userId, circleId),
    };
  }

  @Post('circles/:circleId/leave')
  async leaveCircle(
    @Req() request: RequestWithFirebaseUser,
    @Param('circleId') circleId: string,
  ) {
    const userId = await this.currentUserId(request);

    return this.communityService.leaveCircle(userId, circleId);
  }

  @Get('circles/:circleId/members')
  async listCircleMembers(
    @Req() request: RequestWithFirebaseUser,
    @Param('circleId') circleId: string,
  ) {
    const userId = await this.currentUserId(request);

    return {
      members: await this.communityService.listCircleMembers(userId, circleId),
    };
  }

  @Patch('circles/:circleId/members/:memberId')
  async updateCircleMembership(
    @Req() request: RequestWithFirebaseUser,
    @Param('circleId') circleId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMembershipDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      membership: await this.communityService.updateCircleMembership(
        userId,
        circleId,
        memberId,
        body.status,
      ),
    };
  }

  @Get('me/activities')
  async listMyActivities(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return this.communityService.listMyActivities(userId);
  }

  @Get('recommendations')
  async listRecommendations(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return this.communityService.listRecommendations(userId);
  }

  @Get('icebreakers/:type/:activityId')
  async getIcebreakers(
    @Req() request: RequestWithFirebaseUser,
    @Param('type') type: string,
    @Param('activityId') activityId: string,
  ) {
    if (type !== ChatThreadType.EVENT && type !== ChatThreadType.CIRCLE) {
      throw new BadRequestException('Icebreakers require an event or circle.');
    }

    const userId = await this.currentUserId(request);

    return this.communityService.getIcebreakers(userId, type, activityId);
  }

  @Post('host-approval/request')
  async requestHostApproval(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return {
      approval: await this.communityService.requestHostApproval(userId),
    };
  }

  @Get('host-approval')
  async getHostApproval(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return { approval: await this.communityService.getHostApproval(userId) };
  }

  @Get('chats/:type/:activityId/messages')
  async listChatMessages(
    @Req() request: RequestWithFirebaseUser,
    @Param('type') type: 'EVENT' | 'CIRCLE',
    @Param('activityId') activityId: string,
  ) {
    const userId = await this.currentUserId(request);

    return {
      messages: await this.communityService.listChatMessages(
        userId,
        type,
        activityId,
      ),
    };
  }

  @Post('chats/:type/:activityId/messages')
  async sendChatMessage(
    @Req() request: RequestWithFirebaseUser,
    @Param('type') type: 'EVENT' | 'CIRCLE',
    @Param('activityId') activityId: string,
    @Body() body: SendChatMessageDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      message: await this.communityService.sendChatMessage(
        userId,
        type,
        activityId,
        body.body,
      ),
    };
  }

  @Get('notifications')
  async listNotifications(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return {
      notifications: await this.communityService.listNotifications(userId),
    };
  }

  @Patch('notifications/:notificationId/read')
  async markNotificationRead(
    @Req() request: RequestWithFirebaseUser,
    @Param('notificationId') notificationId: string,
  ) {
    const userId = await this.currentUserId(request);

    return {
      notification: await this.communityService.markNotificationRead(
        userId,
        notificationId,
      ),
    };
  }

  @Post('push-tokens')
  async registerPushToken(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: RegisterPushTokenDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      pushToken: await this.notifications.registerDeviceToken(userId, body),
    };
  }

  @Post('reports')
  async report(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: ReportUserDto,
  ) {
    const userId = await this.currentUserId(request);

    return { report: await this.communityService.report(userId, body) };
  }

  @Post('blocks')
  async block(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: BlockUserDto,
  ) {
    const userId = await this.currentUserId(request);

    return { block: await this.communityService.block(userId, body) };
  }

  @Get('blocks')
  async listBlocks(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return { blocks: await this.communityService.listBlocks(userId) };
  }

  @Delete('blocks/:blockedUserId')
  async unblock(
    @Req() request: RequestWithFirebaseUser,
    @Param('blockedUserId') blockedUserId: string,
  ) {
    const userId = await this.currentUserId(request);

    return this.communityService.unblock(userId, blockedUserId);
  }

  @Get('settings')
  async getSettings(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return { settings: await this.communityService.getSettings(userId) };
  }

  @Patch('settings')
  async updateSettings(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: UpdateSettingsDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      settings: await this.communityService.updateSettings(userId, body),
    };
  }

  @Patch('emergency-contact')
  async upsertEmergencyContact(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: UpsertEmergencyContactDto,
  ) {
    const userId = await this.currentUserId(request);

    return {
      emergencyContact: await this.communityService.upsertEmergencyContact(
        userId,
        body,
      ),
    };
  }

  private async currentUserId(request: RequestWithFirebaseUser) {
    if (!request.firebaseUser.phone_number) {
      throw new UnauthorizedException(
        'The Firebase token is not associated with a phone number.',
      );
    }

    const user = await this.usersService.upsertFromFirebase(
      firebaseTokenToSessionInput(request.firebaseUser),
    );

    return user.id;
  }
}
