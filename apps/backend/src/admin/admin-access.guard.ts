import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminRole } from '@prisma/client';
import { Request } from 'express';
import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { PrismaService } from '../prisma/prisma.service';

export type AdminActor = {
  label: string;
  role?: AdminRole;
  userId?: string;
};

export interface RequestWithAdminActor extends Request {
  adminActor: AdminActor;
}

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAdminActor>();
    const configuredKey = this.configService.get<string>('NIVA_ADMIN_KEY');
    const providedKey = request.headers['x-niva-admin-key'];

    if (configuredKey && providedKey === configuredKey) {
      request.adminActor = { label: 'bootstrap-key' };
      return true;
    }

    const [scheme, idToken] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !idToken) {
      throw new UnauthorizedException(
        'Use a named admin Firebase session or the bootstrap admin key.',
      );
    }

    const firebaseUser = await this.firebaseAdminService.verifyIdToken(idToken);
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid: firebaseUser.uid },
      include: { adminAccess: true },
    });

    if (!user?.adminAccess?.isActive) {
      throw new ForbiddenException(
        'This account does not have Niva admin access.',
      );
    }

    request.adminActor = {
      label: user.displayName ?? user.username ?? user.id,
      role: user.adminAccess.role,
      userId: user.id,
    };
    return true;
  }
}
