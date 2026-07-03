import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const publicUserSelect = {
  id: true,
  phone: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromFirebase(
    firebaseUid: string,
    phone: string,
  ): Promise<PublicUser> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ firebaseUid }, { phone }],
      },
      select: { id: true },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: { firebaseUid, phone },
        select: publicUserSelect,
      });
    }

    return this.prisma.user.create({
      data: { firebaseUid, phone },
      select: publicUserSelect,
    });
  }
}
