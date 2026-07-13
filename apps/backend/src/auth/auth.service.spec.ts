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
  const createCustomTokenFromPnvToken = jest.fn();
  const upsertFromFirebase = jest.fn();
  const firebaseAdminService = {
    createCustomTokenFromPnvToken,
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
      email: null,
      username: null,
      displayName: null,
      authProviders: ['phone'],
      phoneVerified: true,
      googleVerified: false,
      selfDeclarationAccepted: false,
      selfDeclarationAcceptedAt: null,
      selfDeclarationVersion: null,
      profile: null,
      selfieVerification: null,
      trust: null,
      createdAt: new Date('2026-07-03T00:00:00.000Z'),
      updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    };

    verifyIdToken.mockResolvedValue({
      uid: 'firebase_1',
      phone_number: '+919876543210',
      firebase: {
        identities: { phone: ['+919876543210'] },
        sign_in_provider: 'phone',
      },
    });
    upsertFromFirebase.mockResolvedValue(user);

    await expect(
      authService.createSession('firebase-id-token'),
    ).resolves.toEqual(user);
    expect(upsertFromFirebase).toHaveBeenCalledWith({
      firebaseUid: 'firebase_1',
      phone: '+919876543210',
      email: undefined,
      authProviders: ['phone'],
      phoneVerified: true,
      googleVerified: false,
    });
  });

  it('rejects a token that does not represent a phone-authenticated user', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'firebase_1' });

    await expect(
      authService.createSession('firebase-id-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('delegates Firebase PNV token exchange to the Firebase Admin service', async () => {
    createCustomTokenFromPnvToken.mockResolvedValue('firebase-custom-token');

    await expect(
      authService.exchangePnvToken('signed-pnv-token'),
    ).resolves.toBe('firebase-custom-token');
    expect(createCustomTokenFromPnvToken).toHaveBeenCalledWith(
      'signed-pnv-token',
    );
  });
});
