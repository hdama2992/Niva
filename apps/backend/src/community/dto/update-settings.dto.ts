import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  showProfileInRecommendations?: boolean;

  @IsOptional()
  @IsBoolean()
  allowCircleContinuitySuggestions?: boolean;
}
