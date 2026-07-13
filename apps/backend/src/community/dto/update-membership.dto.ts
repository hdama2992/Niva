import { IsIn } from 'class-validator';

export class UpdateMembershipDto {
  @IsIn(['APPROVED', 'CANCELLED'])
  status!: 'APPROVED' | 'CANCELLED';
}
