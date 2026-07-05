import { IsString, Matches } from 'class-validator';

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export class SetUsernameDto {
  @IsString()
  @Matches(USERNAME_PATTERN, {
    message:
      'Username must be 3-20 characters and use lowercase letters, numbers, or underscores.',
  })
  username!: string;
}
