import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ActivityDifficulty } from '@prisma/client';

export class UpdateCircleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  locationName?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  schedule?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(16)
  durationWeeks?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(16)
  capacity?: number;

  @IsOptional()
  @IsEnum(ActivityDifficulty)
  difficulty?: ActivityDifficulty;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  interests?: string[];
}
