import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertSelfieStoragePathOwnership,
  UsersService,
} from './users.service';

describe('verification selfie storage ownership', () => {
  it('accepts a selfie path owned by the authenticated Firebase user', () => {
    expect(() =>
      assertSelfieStoragePathOwnership(
        'firebase_user_1',
        'verification-selfies/firebase_user_1/1720000000000.jpg',
      ),
    ).not.toThrow();
  });

  it('rejects a selfie path owned by a different Firebase user', () => {
    expect(() =>
      assertSelfieStoragePathOwnership(
        'firebase_user_1',
        'verification-selfies/firebase_user_2/1720000000000.jpg',
      ),
    ).toThrow(BadRequestException);
  });
});

describe('username availability', () => {
  const findUnique = jest.fn();
  const service = new UsersService({
    usernameReservation: { findUnique },
  } as unknown as PrismaService);

  beforeEach(() => {
    findUnique.mockReset();
  });

  it('rejects an invalid username without querying reservations', async () => {
    await expect(
      service.getUsernameAvailability('user_1', 'No spaces'),
    ).resolves.toEqual({ available: false, username: 'no spaces' });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('returns available when no reservation exists', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.getUsernameAvailability('user_1', 'himaja'),
    ).resolves.toEqual({ available: true, username: 'himaja' });
  });

  it('returns unavailable when another member owns the reservation', async () => {
    findUnique.mockResolvedValue({ userId: 'user_2' });

    await expect(
      service.getUsernameAvailability('user_1', 'himaja'),
    ).resolves.toEqual({ available: false, username: 'himaja' });
  });

  it('allows the current member to keep their username', async () => {
    findUnique.mockResolvedValue({ userId: 'user_1' });

    await expect(
      service.getUsernameAvailability('user_1', 'himaja'),
    ).resolves.toEqual({ available: true, username: 'himaja' });
  });
});

describe('welcome completion', () => {
  const update = jest.fn();
  const service = new UsersService({
    user: { update },
  } as unknown as PrismaService);

  beforeEach(() => {
    update.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('records completion and returns the refreshed public member', async () => {
    jest.useFakeTimers();
    const completedAt = new Date('2026-07-17T12:00:00.000Z');
    jest.setSystemTime(completedAt);
    const publicUser = {
      id: 'user_1',
      welcomeCompletedAt: completedAt,
    };
    update.mockResolvedValue(publicUser);

    await expect(service.completeWelcome('user_1')).resolves.toBe(publicUser);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { welcomeCompletedAt: completedAt },
        where: { id: 'user_1' },
      }),
    );
  });
});

describe('onboarding completion', () => {
  const update = jest.fn();
  const service = new UsersService({
    user: { update },
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-19T10:30:00.000Z'));
    update.mockReset().mockResolvedValue({ id: 'user_1' });
    jest
      .spyOn(service as never, 'recordTrustEventOnce')
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(service as never, 'recalculateTrustScore')
      .mockResolvedValue(undefined as never);
    jest
      .spyOn(service as never, 'getPublicUserById')
      .mockResolvedValue({ id: 'user_1' } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('finishes onboarding when the community declaration is accepted', async () => {
    await service.acceptSelfDeclaration('user_1', {
      accepted: true,
      version: 'v1',
    });

    expect(update).toHaveBeenCalledWith({
      data: {
        selfDeclarationAccepted: true,
        selfDeclarationAcceptedAt: new Date('2026-07-19T10:30:00.000Z'),
        selfDeclarationVersion: 'v1',
        welcomeCompletedAt: new Date('2026-07-19T10:30:00.000Z'),
      },
      where: { id: 'user_1' },
    });
  });
});
