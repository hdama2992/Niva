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
