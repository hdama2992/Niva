import { IsBoolean } from 'class-validator';

export class UpdateContinuityPreferenceDto {
  @IsBoolean()
  wantsSimilarEvents!: boolean;

  @IsBoolean()
  wantsCircleSuggestions!: boolean;
}
