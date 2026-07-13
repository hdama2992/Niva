import { IsIn, IsString, MaxLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @MaxLength(255)
  token!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';
}
