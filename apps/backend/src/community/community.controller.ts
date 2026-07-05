import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import type { RequestWithFirebaseUser } from '../firebase/firebase-auth.guard';
import {
  firebaseTokenToSessionInput,
  UsersService,
} from '../users/users.service';
import { CommunityService } from './community.service';
import { BlockUserDto } from './dto/block-user.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ReportUserDto } from './dto/report-user.dto';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpsertEmergencyContactDto } from './dto/upsert-emergency-contact.dto';

@Controller('community')
@UseGuards(FirebaseAuthGuard)
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly usersService: UsersService,
  ) {}

  @Get('events')
  async listEvents(@Query('city') city?: string) {
    return { events: await this.communityService.listEvents(city) };
  }

  @Post('events')
  async createEvent(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: CreateEventDto,
  ) {
    const userId = await this.currentUserId(request);

    return { event: await this.communityService.createEvent(userId, body) };
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

  @Get('circles')
  async listCircles(@Query('city') city?: string) {
    return { circles: await this.communityService.listCircles(city) };
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

  @Get('me/activities')
  async listMyActivities(@Req() request: RequestWithFirebaseUser) {
    const userId = await this.currentUserId(request);

    return this.communityService.listMyActivities(userId);
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
