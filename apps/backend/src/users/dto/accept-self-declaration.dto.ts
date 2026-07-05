import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class AcceptSelfDeclarationDto {
  @IsBoolean()
  accepted!: boolean;

  @IsOptional()
  @IsIn(['v1'])
  version?: 'v1';
}
