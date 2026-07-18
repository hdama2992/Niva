import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SUPPORTED_CITIES } from '../../common/constants/supported-cities';

export class RequestBetaAccessDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsIn(SUPPORTED_CITIES)
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
