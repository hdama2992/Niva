import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  private readonly app?: App;

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
