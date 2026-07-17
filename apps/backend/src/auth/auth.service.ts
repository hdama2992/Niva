import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import {
  firebaseTokenToSessionInput,
  PublicUser,
  UsersService,
} from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly usersService: UsersService,
  ) {}

  async createSession(idToken: string): Promise<PublicUser> {
    const firebaseUser = await this.firebaseAdminService.verifyIdToken(idToken);

    if (!firebaseUser.phone_number && !firebaseUser.email) {
      throw new UnauthorizedException(
        'The Firebase token does not contain a supported identity.',
      );
    }

    return this.usersService.upsertFromFirebase(
      firebaseTokenToSessionInput(firebaseUser),
    );
  }

  async exchangePnvToken(pnvToken: string): Promise<string> {
    return this.firebaseAdminService.createCustomTokenFromPnvToken(pnvToken);
  }
}
