import { IsEnum, IsString } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class GrantAdminAccessDto {
  @IsString()
  userId!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;
}
