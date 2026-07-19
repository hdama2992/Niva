import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type HealthResponse = {
  status: 'ok';
  service: 'niva-backend';
  timestamp: string;
};

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  getLiveness(): HealthResponse {
    return this.response();
  }

  @Get('ready')
  async getReadiness(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.response();
    } catch {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        service: 'niva-backend',
        dependency: 'database',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private response(): HealthResponse {
    return {
      status: 'ok',
      service: 'niva-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
