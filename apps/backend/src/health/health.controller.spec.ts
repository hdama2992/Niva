import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns a liveness response without checking dependencies', () => {
    const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    expect(controller.getLiveness()).toMatchObject({
      status: 'ok',
      service: 'niva-backend',
    });
  });

  it('returns ready when the database responds', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    await expect(controller.getReadiness()).resolves.toMatchObject({
      status: 'ok',
      service: 'niva-backend',
    });
  });

  it('returns unavailable when the database cannot be reached', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    await expect(controller.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
