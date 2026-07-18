import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ActivityDifficulty } from '@prisma/client';
import { SUPPORTED_CITIES } from '../../common/constants/supported-cities';

export class CreateEventDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(1000)
  description!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  hostNote?: string;

  @IsString()
  @IsIn(SUPPORTED_CITIES)
  @MaxLength(80)
  city!: string;

  @IsString()
  @MaxLength(140)
  locationName!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsInt()
  @Min(2)
  capacity!: number;

  @IsEnum(ActivityDifficulty)
  difficulty!: ActivityDifficulty;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  interests!: string[];
}
