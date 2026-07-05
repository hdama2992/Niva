import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SelfieVerificationStatus,
  TrustEventType,
  TrustTier,
  TrustVerificationStatus,
  VerificationReviewStatus,
} from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from '../prisma/prisma.service';
import { AcceptSelfDeclarationDto } from './dto/accept-self-declaration.dto';
import { SubmitSelfieDto } from './dto/submit-selfie.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { USERNAME_PATTERN } from './dto/set-username.dto';

const publicUserSelect = {
  id: true,
  phone: true,
  email: true,
  username: true,
  displayName: true,
  authProviders: true,
  phoneVerified: true,
  googleVerified: true,
  selfDeclarationAccepted: true,
  selfDeclarationAcceptedAt: true,
  selfDeclarationVersion: true,
  profile: true,
  selfieVerification: true,
  trust: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const TRUST_POINTS: Record<TrustEventType, number> = {
  [TrustEventType.PHONE_VERIFIED]: 15,
  [TrustEventType.GOOGLE_LINKED]: 5,
  [TrustEventType.USERNAME_SET]: 5,
  [TrustEventType.PROFILE_COMPLETED]: 10,
  [TrustEventType.SELF_DECLARATION_ACCEPTED]: 10,
  [TrustEventType.SELFIE_SUBMITTED]: 0,
  [TrustEventType.SELFIE_APPROVED]: 25,
  [TrustEventType.SELFIE_REJECTED]: 0,
  [TrustEventType.EVENT_ATTENDED]: 5,
  [TrustEventType.NO_SHOW]: -10,
  [TrustEventType.REPORT_CONFIRMED]: -50,
};

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export type FirebaseSessionInput = {
  firebaseUid: string;
  phone?: string;
  email?: string;
  authProviders?: string[];
  phoneVerified?: boolean;
  googleVerified?: boolean;
};

export function firebaseTokenToSessionInput(
  firebaseUser: DecodedIdToken,
): FirebaseSessionInput {
  const providers = new Set<string>();
  const firebaseIdentity = firebaseUser.firebase;
  const signInProvider = firebaseIdentity?.sign_in_provider;
  const identities = firebaseIdentity?.identities ?? {};

  if (firebaseUser.phone_number) {
    providers.add('phone');
  }

  if (firebaseUser.email) {
    providers.add('email');
  }

  if (signInProvider && signInProvider !== 'anonymous') {
    providers.add(signInProvider === 'phone' ? 'phone' : signInProvider);
  }

  Object.keys(identities).forEach((provider) => {
    providers.add(provider === 'phone' ? 'phone' : provider);
  });

  return {
    firebaseUid: firebaseUser.uid,
    phone: firebaseUser.phone_number,
    email: firebaseUser.email,
    authProviders: [...providers].sort(),
    phoneVerified: Boolean(firebaseUser.phone_number),
    googleVerified: providers.has('google.com'),
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromFirebase(
    firebaseUidOrInput: string | FirebaseSessionInput,
    phone?: string,
  ): Promise<PublicUser> {
    const input =
      typeof firebaseUidOrInput === 'string'
        ? {
            firebaseUid: firebaseUidOrInput,
            phone,
            authProviders: phone ? ['phone'] : [],
            phoneVerified: Boolean(phone),
            googleVerified: false,
          }
        : firebaseUidOrInput;
    const providers = this.normalizeProviders(input.authProviders ?? []);
    const identityMatches: Prisma.UserWhereInput[] = [
      { firebaseUid: input.firebaseUid },
    ];

    if (input.phone) {
      identityMatches.push({ phone: input.phone });
    }

    if (input.email) {
      identityMatches.push({ email: input.email });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: identityMatches },
      select: {
        id: true,
        authProviders: true,
        phoneVerified: true,
        googleVerified: true,
      },
    });
    const mergedProviders = this.normalizeProviders([
      ...(existingUser?.authProviders ?? []),
      ...providers,
    ]);
    const phoneVerified = Boolean(
      existingUser?.phoneVerified || input.phoneVerified || input.phone,
    );
    const googleVerified = Boolean(
      existingUser?.googleVerified ||
      input.googleVerified ||
      providers.includes('google.com'),
    );
    const savedUser = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firebaseUid: input.firebaseUid,
            phone: input.phone ?? undefined,
            email: input.email ?? undefined,
            authProviders: mergedProviders,
            phoneVerified,
            googleVerified,
          },
          select: { id: true, phoneVerified: true, googleVerified: true },
        })
      : await this.prisma.user.create({
          data: {
            firebaseUid: input.firebaseUid,
            phone: input.phone,
            email: input.email,
            authProviders: mergedProviders,
            phoneVerified,
            googleVerified,
          },
          select: { id: true, phoneVerified: true, googleVerified: true },
        });

    await this.ensureTrustProfile(savedUser.id);

    if (savedUser.phoneVerified) {
      await this.recordTrustEventOnce(
        savedUser.id,
        TrustEventType.PHONE_VERIFIED,
      );
    }

    if (savedUser.googleVerified) {
      await this.recordTrustEventOnce(
        savedUser.id,
        TrustEventType.GOOGLE_LINKED,
      );
    }

    await this.recalculateTrustScore(savedUser.id);
    return this.getPublicUserById(savedUser.id);
  }

  async getPublicUserById(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async setUsername(userId: string, username: string): Promise<PublicUser> {
    const normalizedUsername = username.trim();

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      throw new BadRequestException(
        'Username must be 3-20 characters and use lowercase letters, numbers, or underscores.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const conflict = await this.prisma.usernameReservation.findUnique({
      where: { username: normalizedUsername },
      select: { userId: true },
    });

    if (conflict && conflict.userId !== userId) {
      throw new ConflictException('That username is already taken.');
    }

    await this.prisma.$transaction(async (tx) => {
      if (user.username && user.username !== normalizedUsername) {
        await tx.usernameReservation.deleteMany({ where: { userId } });
      }

      await tx.usernameReservation.upsert({
        where: { username: normalizedUsername },
        create: { username: normalizedUsername, userId },
        update: { userId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { username: normalizedUsername },
      });

      await tx.userProfile.updateMany({
        where: { userId },
        data: { username: normalizedUsername },
      });
    });

    await this.recordTrustEventOnce(userId, TrustEventType.USERNAME_SET);
    await this.recalculateTrustScore(userId);
    return this.getPublicUserById(userId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.username) {
      throw new BadRequestException('Choose a username before profile setup.');
    }

    const displayName = dto.displayName.trim();
    const city = dto.city.trim();
    const interests = this.normalizeList(dto.interests);
    const languages = this.normalizeList(dto.languages ?? []);

    if (!displayName || !city || interests.length < 3) {
      throw new BadRequestException(
        'Profile requires display name, city, and at least three interests.',
      );
    }

    const profileCompleteness = this.calculateProfileCompleteness({
      displayName,
      username: user.username,
      city,
      interests,
      profilePhotoUrl: dto.profilePhotoUrl,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { displayName },
      }),
      this.prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName,
          username: user.username,
          city,
          ageRange: dto.ageRange?.trim() || undefined,
          languages,
          occupation: dto.occupation?.trim() || undefined,
          interests,
          bio: dto.bio?.trim() || undefined,
          profilePhotoUrl: dto.profilePhotoUrl,
          profileCompleteness,
        },
        update: {
          displayName,
          username: user.username,
          city,
          ageRange: dto.ageRange?.trim() || null,
          languages,
          occupation: dto.occupation?.trim() || null,
          interests,
          bio: dto.bio?.trim() || null,
          profilePhotoUrl: dto.profilePhotoUrl,
          profileCompleteness,
        },
      }),
    ]);

    await this.recordTrustEventOnce(userId, TrustEventType.PROFILE_COMPLETED);
    await this.recalculateTrustScore(userId);
    return this.getPublicUserById(userId);
  }

  async acceptSelfDeclaration(
    userId: string,
    dto: AcceptSelfDeclarationDto,
  ): Promise<PublicUser> {
    if (!dto.accepted) {
      throw new BadRequestException(
        'Self-declaration must be accepted to continue.',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        selfDeclarationAccepted: true,
        selfDeclarationAcceptedAt: new Date(),
        selfDeclarationVersion: dto.version ?? 'v1',
      },
    });

    await this.recordTrustEventOnce(
      userId,
      TrustEventType.SELF_DECLARATION_ACCEPTED,
    );
    await this.recalculateTrustScore(userId);
    return this.getPublicUserById(userId);
  }

  async submitSelfie(
    userId: string,
    dto: SubmitSelfieDto,
  ): Promise<PublicUser> {
    await this.ensureUserExists(userId);

    await this.prisma.$transaction([
      this.prisma.selfieVerification.upsert({
        where: { userId },
        create: {
          userId,
          status: SelfieVerificationStatus.PENDING,
          selfieUrl: dto.selfieUrl,
          selfieSubmittedAt: new Date(),
          selfieCheckProvider: 'MANUAL',
        },
        update: {
          status: SelfieVerificationStatus.PENDING,
          selfieUrl: dto.selfieUrl,
          selfieSubmittedAt: new Date(),
          selfieCheckProvider: 'MANUAL',
          faceDetected: null,
          imageQuality: null,
          suspectedFake: null,
          suspectedScreenshot: null,
          confidence: null,
        },
      }),
      this.prisma.verificationReview.upsert({
        where: { userId },
        create: {
          userId,
          selfieUrl: dto.selfieUrl,
          status: VerificationReviewStatus.PENDING,
        },
        update: {
          selfieUrl: dto.selfieUrl,
          status: VerificationReviewStatus.PENDING,
          reviewerId: null,
          reason: null,
          reviewedAt: null,
        },
      }),
    ]);

    await this.recordTrustEventOnce(userId, TrustEventType.SELFIE_SUBMITTED);
    await this.recalculateTrustScore(userId);
    return this.getPublicUserById(userId);
  }

  async listVerificationReviews(status?: VerificationReviewStatus) {
    return this.prisma.verificationReview.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: publicUserSelect,
        },
      },
    });
  }

  async reviewSelfie(
    userId: string,
    status: Exclude<VerificationReviewStatus, 'PENDING'>,
    reviewerId?: string,
    reason?: string,
  ) {
    const review = await this.prisma.verificationReview.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!review) {
      throw new NotFoundException('Verification review not found.');
    }

    const selfieStatus = this.mapReviewStatusToSelfieStatus(status);

    await this.prisma.$transaction([
      this.prisma.verificationReview.update({
        where: { userId },
        data: {
          status,
          reviewerId,
          reason,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.selfieVerification.update({
        where: { userId },
        data: { status: selfieStatus },
      }),
    ]);

    if (status === VerificationReviewStatus.APPROVED) {
      await this.recordTrustEventOnce(userId, TrustEventType.SELFIE_APPROVED);
    }

    if (status === VerificationReviewStatus.REJECTED) {
      await this.recordTrustEventOnce(userId, TrustEventType.SELFIE_REJECTED);
    }

    await this.recalculateTrustScore(userId);

    return {
      review: await this.prisma.verificationReview.findUnique({
        where: { userId },
      }),
      user: await this.getPublicUserById(userId),
    };
  }

  private normalizeProviders(providers: string[]): string[] {
    return [
      ...new Set(
        providers
          .map((provider) => provider.trim())
          .filter(Boolean)
          .map((provider) =>
            provider === 'phone_number' ? 'phone' : provider,
          ),
      ),
    ].sort();
  }

  private normalizeList(values: string[]): string[] {
    return [
      ...new Set(values.map((value) => value.trim()).filter(Boolean)),
    ].slice(0, 12);
  }

  private calculateProfileCompleteness(input: {
    displayName: string;
    username: string;
    city: string;
    interests: string[];
    profilePhotoUrl?: string;
  }): number {
    let score = 0;

    if (input.displayName) {
      score += 20;
    }

    if (input.username) {
      score += 20;
    }

    if (input.city) {
      score += 20;
    }

    if (input.interests.length >= 3) {
      score += 25;
    }

    if (input.profilePhotoUrl) {
      score += 15;
    }

    return score;
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private async ensureTrustProfile(userId: string) {
    await this.prisma.trustProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private async recordTrustEventOnce(
    userId: string,
    type: TrustEventType,
    metadata?: Prisma.InputJsonValue,
  ) {
    const existingEvent = await this.prisma.trustEvent.findFirst({
      where: { userId, type },
      select: { id: true },
    });

    if (existingEvent) {
      return;
    }

    await this.prisma.trustEvent.create({
      data: {
        userId,
        type,
        points: TRUST_POINTS[type],
        metadata,
      },
    });
  }

  private async recalculateTrustScore(userId: string) {
    await this.ensureTrustProfile(userId);

    const [user, selfieVerification, trustPoints] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          phoneVerified: true,
          selfDeclarationAccepted: true,
        },
      }),
      this.prisma.selfieVerification.findUnique({ where: { userId } }),
      this.prisma.trustEvent.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const score = trustPoints._sum.points ?? 0;
    const selfieStatus = selfieVerification?.status;
    let verificationStatus: TrustVerificationStatus =
      TrustVerificationStatus.UNVERIFIED;
    let tier: TrustTier = TrustTier.NEW;

    if (
      selfieStatus === SelfieVerificationStatus.PENDING ||
      selfieStatus === SelfieVerificationStatus.NEEDS_REVIEW
    ) {
      verificationStatus = TrustVerificationStatus.PENDING;
    }

    if (selfieStatus === SelfieVerificationStatus.REJECTED) {
      verificationStatus = TrustVerificationStatus.RESTRICTED;
    }

    if (
      user.phoneVerified &&
      user.selfDeclarationAccepted &&
      selfieStatus === SelfieVerificationStatus.APPROVED
    ) {
      verificationStatus = TrustVerificationStatus.VERIFIED;
      tier = TrustTier.BASIC_VERIFIED;
    }

    if (
      verificationStatus === TrustVerificationStatus.VERIFIED &&
      score >= 85
    ) {
      tier = TrustTier.TRUSTED;
    }

    if (
      verificationStatus === TrustVerificationStatus.VERIFIED &&
      score >= 120
    ) {
      tier = TrustTier.HOST_ELIGIBLE;
    }

    await this.prisma.trustProfile.update({
      where: { userId },
      data: { score, tier, verificationStatus },
    });
  }

  private mapReviewStatusToSelfieStatus(
    status: Exclude<VerificationReviewStatus, 'PENDING'>,
  ) {
    switch (status) {
      case VerificationReviewStatus.APPROVED:
        return SelfieVerificationStatus.APPROVED;
      case VerificationReviewStatus.NEEDS_REVIEW:
        return SelfieVerificationStatus.NEEDS_REVIEW;
      case VerificationReviewStatus.REJECTED:
        return SelfieVerificationStatus.REJECTED;
    }
  }
}
