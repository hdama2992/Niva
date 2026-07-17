import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @MaxLength(255)
  @Matches(/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/)
  token!: string;

  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';
}
