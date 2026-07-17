import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountLifecycleService } from './account-lifecycle.service';

describe('AccountLifecycleService', () => {
  const upsert = jest.fn();
  const service = new AccountLifecycleService({
    accountDeletionRequest: { upsert },
  } as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it.each(['Member@Example.com', '+919876543210'])(
    'records a valid deletion request for %s',
    async (identifier) => {
      await expect(service.requestDeletion({ identifier })).resolves.toEqual({
        accepted: true,
      });
      expect(upsert).toHaveBeenCalledWith({
        where: { identifier: identifier.toLowerCase() },
        create: { identifier: identifier.toLowerCase() },
        update: { status: 'PENDING' },
      });
    },
  );

  it('rejects an identifier that cannot be used to verify ownership', async () => {
    await expect(
      service.requestDeletion({ identifier: 'not-an-account' }),
    ).rejects.toThrow(BadRequestException);
    expect(upsert).not.toHaveBeenCalled();
  });
});
