import { IsBoolean, IsIn } from 'class-validator';

export class AcceptCommunityGuidelinesDto {
  @IsBoolean()
  accepted!: boolean;

  @IsIn(['v1'])
  version!: 'v1';
}
