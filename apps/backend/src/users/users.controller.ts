import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { FirebaseAuthGuard } from '../firebase/firebase-auth.guard';
import type { RequestWithFirebaseUser } from '../firebase/firebase-auth.guard';
import { AcceptSelfDeclarationDto } from './dto/accept-self-declaration.dto';
import { AcceptCommunityGuidelinesDto } from './dto/accept-community-guidelines.dto';
import { SetUsernameDto } from './dto/set-username.dto';
import { SubmitSelfieDto } from './dto/submit-selfie.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import {
  firebaseTokenToSessionInput,
  PublicUser,
  UsersService,
} from './users.service';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

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

  @Get('me/username-availability')
  async getUsernameAvailability(
    @Req() request: RequestWithFirebaseUser,
    @Query('username') username = '',
  ) {
    const user = await this.currentUser(request);

    return this.usersService.getUsernameAvailability(user.id, username);
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

  @Post('me/community-guidelines')
  async acceptCommunityGuidelines(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: AcceptCommunityGuidelinesDto,
  ) {
    const user = await this.currentUser(request);

    return {
      user: await this.usersService.acceptCommunityGuidelines(
        user.id,
        body.accepted,
        body.version,
      ),
    };
  }

  @Post('me/selfie')
  async submitSelfie(
    @Req() request: RequestWithFirebaseUser,
    @Body() body: SubmitSelfieDto,
  ) {
    const user = await this.currentUser(request);

    return {
      user: await this.usersService.submitSelfie(
        user.id,
        request.firebaseUser.uid,
        body,
      ),
    };
  }

  @Delete('me')
  async deleteAccount(
    @Req() request: RequestWithFirebaseUser,
    @Body() _body: DeleteAccountDto,
  ) {
    const user = await this.currentUser(request);
    await this.firebaseAdminService.deleteUserIdentityAndMedia(
      request.firebaseUser.uid,
    );
    await this.usersService.deleteAccountData(user.id);

    return { deleted: true };
  }

  private async currentUser(
    request: RequestWithFirebaseUser,
  ): Promise<PublicUser> {
    if (!request.firebaseUser.phone_number && !request.firebaseUser.email) {
      throw new UnauthorizedException(
        'The Firebase token does not contain a supported identity.',
      );
    }

    return this.usersService.upsertFromFirebase(
      firebaseTokenToSessionInput(request.firebaseUser),
    );
  }
}
