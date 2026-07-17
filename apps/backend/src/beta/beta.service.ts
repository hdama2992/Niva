import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestBetaAccessDto } from './dto/request-beta-access.dto';

@Injectable()
export class BetaService {
  constructor(private readonly prisma: PrismaService) {}

  async requestAccess(input: RequestBetaAccessDto) {
    if (input.company) {
      return { accepted: true };
    }

    const email = input.email.trim().toLowerCase();
    await this.prisma.betaAccessRequest.upsert({
      where: { email },
      create: {
        city: input.city.trim(),
        email,
        interest: input.interest.trim(),
      },
      update: {
        city: input.city.trim(),
        interest: input.interest.trim(),
        status: 'PENDING',
      },
    });

    return { accepted: true };
  }
}
