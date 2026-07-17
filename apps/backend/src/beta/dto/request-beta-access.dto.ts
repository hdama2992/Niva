import {
  Equals,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RequestBetaAccessDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsString()
  @MaxLength(80)
  interest!: string;

  @IsBoolean()
  @Equals(true)
  consent!: true;

  @IsOptional()
  @IsString()
  company?: string;
}
