import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
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
  @IsString({ each: true })
  interests!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ageRange?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  occupation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  profilePhotoUrl?: string;
}
