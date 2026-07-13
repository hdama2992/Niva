import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExchangePnvTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8192)
  pnvToken!: string;
}
