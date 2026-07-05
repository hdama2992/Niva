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
import { UsersService } from '../users/users.service';
import { AdminKeyGuard } from './admin-key.guard';
import { ReviewVerificationDto } from './dto/review-verification.dto';

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('verification-reviews')
  async listVerificationReviews(
    @Query('status') status?: VerificationReviewStatus,
  ) {
    return {
      reviews: await this.usersService.listVerificationReviews(status),
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
