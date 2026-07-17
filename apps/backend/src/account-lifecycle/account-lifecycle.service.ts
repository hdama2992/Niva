import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestAccountDeletionDto } from './dto/request-account-deletion.dto';

@Injectable()
export class AccountLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async requestDeletion(input: RequestAccountDeletionDto) {
    if (input.company) {
      return { accepted: true };
    }

    const identifier = input.identifier.trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+\d{8,15}$/.test(identifier);
    if (!isEmail && !isPhone) {
      throw new BadRequestException(
        'Enter the email address or international phone number used for Niva.',
      );
    }

    await this.prisma.accountDeletionRequest.upsert({
      where: { identifier },
      create: { identifier },
      update: { status: 'PENDING' },
    });
    return { accepted: true };
  }
}
