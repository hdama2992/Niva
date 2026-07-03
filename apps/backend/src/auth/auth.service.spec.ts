import { UnauthorizedException } from '@nestjs/common';

jest.mock('firebase-admin/app', () => ({
  cert: jest.fn(),
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

import { FirebaseAdminService } from '../firebase/firebase-admin.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const verifyIdToken = jest.fn();
  const upsertFromFirebase = jest.fn();
  const firebaseAdminService = {
    verifyIdToken,
  } as unknown as FirebaseAdminService;
  const usersService = {
    upsertFromFirebase,
  } as unknown as UsersService;
  const authService = new AuthService(firebaseAdminService, usersService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates or updates a local user from a verified Firebase phone token', async () => {
    const user = {
      id: 'user_1',
      phone: '+919876543210',
      name: null,
      createdAt: new Date('2026-07-03T00:00:00.000Z'),
      updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    };

    verifyIdToken.mockResolvedValue({
      uid: 'firebase_1',
      phone_number: '+919876543210',
    });
    upsertFromFirebase.mockResolvedValue(user);

    await expect(
      authService.createSession('firebase-id-token'),
    ).resolves.toEqual(user);
    expect(upsertFromFirebase).toHaveBeenCalledWith(
      'firebase_1',
      '+919876543210',
    );
  });

  it('rejects a token that does not represent a phone-authenticated user', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'firebase_1' });

    await expect(
      authService.createSession('firebase-id-token'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
