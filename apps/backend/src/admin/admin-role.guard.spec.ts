import { ForbiddenException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { AdminRoleGuard } from './admin-role.guard';

describe('AdminRoleGuard', () => {
  const getRequest = jest.fn();
  const context = {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: () => ({ getRequest }),
  } as never;
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new AdminRoleGuard(reflector as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows a named admin with an assigned role', () => {
    reflector.getAllAndOverride.mockReturnValue([AdminRole.REVIEWER]);
    getRequest.mockReturnValue({
      adminActor: { label: 'Priya', role: AdminRole.REVIEWER },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a named admin outside the assigned role', () => {
    reflector.getAllAndOverride.mockReturnValue([AdminRole.COMMUNITY_MANAGER]);
    getRequest.mockReturnValue({
      adminActor: { label: 'Priya', role: AdminRole.REVIEWER },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('keeps the temporary bootstrap key path available during closed beta', () => {
    reflector.getAllAndOverride.mockReturnValue([AdminRole.SUPER_ADMIN]);
    getRequest.mockReturnValue({
      adminActor: { label: 'bootstrap-key' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
