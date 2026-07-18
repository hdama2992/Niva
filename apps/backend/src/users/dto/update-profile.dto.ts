import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(60)
  displayName!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  interests!: string[];

  @IsInt()
  @Min(18)
  @Max(100)
  age!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  languages!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @IsUrl({ require_tld: false })
  profilePhotoUrl!: string;
}
