import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ActivityDifficulty } from '@prisma/client';

export class CreateCircleDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  @MaxLength(1000)
  description!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsString()
  @MaxLength(140)
  locationName!: string;

  @IsDateString()
  startsAt!: string;

  @IsString()
  @MaxLength(120)
  schedule!: string;

  @IsInt()
  @Min(2)
  @Max(16)
  durationWeeks!: number;

  @IsInt()
  @Min(2)
  @Max(16)
  capacity!: number;

  @IsEnum(ActivityDifficulty)
  difficulty!: ActivityDifficulty;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  interests!: string[];
}
