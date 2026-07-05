import { IsString, MaxLength } from 'class-validator';

export class UpsertEmergencyContactDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(60)
  relationship!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;
}
