import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewVerificationDto {
  @IsIn(['APPROVED', 'REJECTED', 'NEEDS_REVIEW'])
  status!: 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reviewerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
