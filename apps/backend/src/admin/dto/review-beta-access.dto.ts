import { IsIn } from 'class-validator';

export class ReviewBetaAccessDto {
  @IsIn(['INVITED', 'DECLINED'])
  status!: 'INVITED' | 'DECLINED';
}
