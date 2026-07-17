import { IsIn } from 'class-validator';

export class ReviewAccountDeletionDto {
  @IsIn(['IN_REVIEW', 'COMPLETED', 'REJECTED'])
  status!: 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
}
