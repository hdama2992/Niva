import { IsString, Matches } from 'class-validator';

export class SubmitSelfieDto {
  @IsString()
  @Matches(/^verification-selfies\/[^/]+\/[A-Za-z0-9._-]+$/)
  selfieStoragePath!: string;
}
