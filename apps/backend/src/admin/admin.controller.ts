import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VerificationReviewStatus } from '@prisma/client';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { UsersService } from '../users/users.service';
import { AdminKeyGuard } from './admin-key.guard';
import { ReviewVerificationDto } from './dto/review-verification.dto';

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

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
  ) {
    return this.usersService.reviewSelfie(
      userId,
      body.status,
      body.reviewerId,
      body.reason,
    );
  }
}
