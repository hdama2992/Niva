import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAdminService } from './firebase-admin.service';

export interface RequestWithFirebaseUser extends Request {
  firebaseUser: DecodedIdToken;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithFirebaseUser>();
    const [scheme, idToken] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !idToken) {
      throw new UnauthorizedException(
        'Provide a Firebase ID token as a Bearer token.',
      );
    }

    request.firebaseUser =
      await this.firebaseAdminService.verifyIdToken(idToken);
    return true;
  }
}
