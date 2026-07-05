import { IsUrl } from 'class-validator';

export class SubmitSelfieDto {
  @IsUrl({ require_tld: false })
  selfieUrl!: string;
}
