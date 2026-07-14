import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateActivityLocationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(140)
  locationName!: string;
}
