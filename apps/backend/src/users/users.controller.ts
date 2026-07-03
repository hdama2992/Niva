import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import type { RequestWithFirebaseUser } from '../firebase/firebase-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@Req() request: RequestWithFirebaseUser) {
    const phone = request.firebaseUser.phone_number;

    if (!phone) {
      throw new UnauthorizedException(
        'The Firebase token is not associated with a phone number.',
      );
    }

    return {
      user: await this.usersService.upsertFromFirebase(
        request.firebaseUser.uid,
        phone,
      ),
    };
  }
}
