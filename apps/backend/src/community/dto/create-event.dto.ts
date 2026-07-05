import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ActivityDifficulty } from '@prisma/client';

export class CreateEventDto {
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
