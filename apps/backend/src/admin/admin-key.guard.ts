import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const configuredKey = this.configService.get<string>('NIVA_ADMIN_KEY');
    const providedKey = request.headers['x-niva-admin-key'];

    if (!configuredKey) {
      throw new UnauthorizedException(
        'Set NIVA_ADMIN_KEY before using admin review endpoints.',
      );
    }

    if (providedKey !== configuredKey) {
      throw new UnauthorizedException('Invalid admin key.');
    }

    return true;
  }
}
