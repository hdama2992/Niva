import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '@prisma/client';
import { AdminActor, RequestWithAdminActor } from './admin-access.guard';
import { ADMIN_ROLES_KEY } from './admin-roles.decorator';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAdminActor>();
    const actor = request.adminActor;

    // The shared secret remains a temporary closed-beta bootstrap path. Named
    // Firebase admins are always checked against their persisted role.
    if (actor?.label === 'bootstrap-key') {
      return true;
    }

    if (!actor?.role || !this.hasRole(actor, allowedRoles)) {
      throw new ForbiddenException(
        'This admin account does not have permission for that action.',
      );
    }

    return true;
  }

  private hasRole(actor: AdminActor, allowedRoles: AdminRole[]) {
    return (
      actor.role === AdminRole.SUPER_ADMIN ||
      (actor.role !== undefined && allowedRoles.includes(actor.role))
    );
  }
}
