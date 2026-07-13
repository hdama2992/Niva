import { IsIn } from 'class-validator';

export class UpdateAttendanceDto {
  @IsIn(['ATTENDED', 'NO_SHOW'])
  status!: 'ATTENDED' | 'NO_SHOW';
}
