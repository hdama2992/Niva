import { PrismaService } from '../prisma/prisma.service';
import { BetaService } from './beta.service';

describe('BetaService', () => {
  const upsert = jest.fn();
  const service = new BetaService({
    betaAccessRequest: { upsert },
  } as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('normalizes and persists a beta access request', async () => {
    await expect(
      service.requestAccess({
        city: ' Bangalore ',
        consent: true,
        email: ' Member@Example.com ',
        interest: ' Joining a circle ',
      }),
    ).resolves.toEqual({ accepted: true });

    expect(upsert).toHaveBeenCalledWith({
      where: { email: 'member@example.com' },
      create: {
        city: 'Bangalore',
        email: 'member@example.com',
        interest: 'Joining a circle',
      },
      update: {
        city: 'Bangalore',
        interest: 'Joining a circle',
        status: 'PENDING',
      },
    });
  });

  it('silently accepts honeypot submissions without storing them', async () => {
    await service.requestAccess({
      city: 'Bangalore',
      company: 'bot',
      consent: true,
      email: 'bot@example.com',
      interest: 'Joining gatherings',
    });

    expect(upsert).not.toHaveBeenCalled();
  });
});
