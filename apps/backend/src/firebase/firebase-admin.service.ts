import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

type PnvJwks = ReturnType<(typeof import('jose'))['createRemoteJWKSet']>;

@Injectable()
export class FirebaseAdminService {
  private readonly app?: App;
  private pnvJwks?: PnvJwks;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (projectId && clientEmail && privateKey) {
      this.app =
        getApps().find((app) => app.name === 'niva') ??
        initializeApp(
          {
            credential: cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
          },
          'niva',
        );
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    const betaPhone = this.getBetaPhone(idToken);

    if (betaPhone) {
      return {
        aud: 'niva-beta',
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        firebase: {
          identities: { phone: [betaPhone] },
          sign_in_provider: 'phone',
        },
        iat: Math.floor(Date.now() / 1000),
        iss: 'niva-beta',
        phone_number: betaPhone,
        sub: `beta:${betaPhone}`,
        uid: `beta:${betaPhone}`,
      };
    }

    if (!this.app) {
      throw new ServiceUnavailableException(
        'Firebase Admin is not configured. Add Firebase service-account values to apps/backend/.env.',
      );
    }

    try {
      return await getAuth(this.app).verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException(
        'The Firebase ID token is invalid or expired.',
      );
    }
  }

  async createPrivateSelfieViewerUrl(storagePath: string): Promise<string> {
    if (!this.app) {
      throw new ServiceUnavailableException(
        'Firebase Admin is not configured for verification image access.',
      );
    }

    const bucketName = this.configService.get<string>(
      'FIREBASE_STORAGE_BUCKET',
    );
    if (!bucketName) {
      throw new ServiceUnavailableException(
        'Set FIREBASE_STORAGE_BUCKET before viewing verification images.',
      );
    }

    if (!/^verification-selfies\/[^/]+\/[A-Za-z0-9._-]+$/.test(storagePath)) {
      throw new UnauthorizedException('Invalid verification image path.');
    }

    const [url] = await getStorage(this.app)
      .bucket(bucketName)
      .file(storagePath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 5 * 60 * 1000,
      });

    return url;
  }

  async createCustomTokenFromPnvToken(pnvToken: string): Promise<string> {
    if (
      this.configService.get<string>('FIREBASE_PNV_ENABLED') !== 'true' ||
      !this.app
    ) {
      throw new ServiceUnavailableException(
        'Firebase Phone Number Verification is not enabled for this environment.',
      );
    }

    const projectNumber = this.configService.get<string>(
      'FIREBASE_PROJECT_NUMBER',
    );
    if (!projectNumber) {
      throw new ServiceUnavailableException(
        'Set FIREBASE_PROJECT_NUMBER before enabling Firebase Phone Number Verification.',
      );
    }

    const issuer = `https://fpnv.googleapis.com/projects/${projectNumber}`;
    let phoneNumber: string | undefined;

    try {
      const { createRemoteJWKSet, jwtVerify } = await import('jose');
      this.pnvJwks ??= createRemoteJWKSet(
        new URL('https://fpnv.googleapis.com/v1beta/jwks'),
      );
      const { payload } = await jwtVerify(pnvToken, this.pnvJwks, {
        audience: issuer,
        issuer,
      });
      phoneNumber = payload.sub;
    } catch {
      throw new UnauthorizedException(
        'The Firebase Phone Number Verification token is invalid or expired.',
      );
    }

    if (!phoneNumber || !/^\+\d{8,15}$/.test(phoneNumber)) {
      throw new UnauthorizedException(
        'The Firebase Phone Number Verification token does not contain a valid phone number.',
      );
    }

    const auth = getAuth(this.app);
    let firebaseUser;

    try {
      firebaseUser = await auth.getUserByPhoneNumber(phoneNumber);
    } catch (error) {
      if (getFirebaseErrorCode(error) !== 'auth/user-not-found') {
        throw new ServiceUnavailableException(
          'Unable to look up the Firebase user for this phone number.',
        );
      }

      try {
        firebaseUser = await auth.createUser({ phoneNumber });
      } catch {
        throw new ServiceUnavailableException(
          'Unable to create the Firebase user for this phone number.',
        );
      }
    }

    return auth.createCustomToken(firebaseUser.uid);
  }

  private getBetaPhone(idToken: string): string | undefined {
    const betaAuthEnabled =
      this.configService.get<string>('NIVA_BETA_AUTH_ENABLED') === 'true';

    if (!betaAuthEnabled || !idToken.startsWith('niva-beta:')) {
      return undefined;
    }

    const phone = idToken.replace('niva-beta:', '').trim();

    return /^\+\d{8,15}$/.test(phone) ? phone : undefined;
  }
}

function getFirebaseErrorCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return undefined;
}
