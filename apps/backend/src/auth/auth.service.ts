import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { PublicUser, UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly usersService: UsersService,
  ) {}

  async createSession(idToken: string): Promise<PublicUser> {
    const firebaseUser = await this.firebaseAdminService.verifyIdToken(idToken);

    if (!firebaseUser.phone_number) {
      throw new UnauthorizedException(
        'The Firebase token is not associated with a phone number.',
      );
    }

    return this.usersService.upsertFromFirebase(
      firebaseUser.uid,
      firebaseUser.phone_number,
    );
  }
}
