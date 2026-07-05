import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import type { RequestWithFirebaseUser } from '../firebase/firebase-auth.guard';
import { AcceptSelfDeclarationDto } from './dto/accept-self-declaration.dto';
import { SetUsernameDto } from './dto/set-username.dto';
import { SubmitSelfieDto } from './dto/submit-selfie.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  firebaseTokenToSessionInput,
  PublicUser,
  UsersService,
} from './users.service';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() request: RequestWithFirebaseUser) {
    return { user: await this.currentUser(request) };
  }

  @Post('me/username')
  async setUsername(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: SetUsernameDto,
  ) {
    const user = await this.currentUser(request);

    return {
      user: await this.usersService.setUsername(user.id, body.username),
    };
  }

  @Put('me/profile')
  async updateProfile(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: UpdateProfileDto,
  ) {
    const user = await this.currentUser(request);

    return {
      user: await this.usersService.updateProfile(user.id, body),
    };
  }

  @Post('me/self-declaration')
  async acceptSelfDeclaration(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: AcceptSelfDeclarationDto,
  ) {
    const user = await this.currentUser(request);

    return {
      user: await this.usersService.acceptSelfDeclaration(user.id, body),
    };
  }

  @Post('me/selfie')
  async submitSelfie(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: SubmitSelfieDto,
  ) {
    const user = await this.currentUser(request);

    return {
      user: await this.usersService.submitSelfie(user.id, body),
    };
  }

  private async currentUser(
    request: RequestWithFirebaseUser,
  ): Promise<PublicUser> {
    const phone = request.firebaseUser.phone_number;

    if (!phone) {
      throw new UnauthorizedException(
        'The Firebase token is not associated with a phone number.',
      );
    }

    return this.usersService.upsertFromFirebase(
      firebaseTokenToSessionInput(request.firebaseUser),
    );
  }
}
