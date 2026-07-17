import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestAccountDeletionDto {
  @IsString()
  @MaxLength(254)
  identifier!: string;

  @IsOptional()
  @IsString()
  company?: string;
}
