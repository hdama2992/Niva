import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelActivityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  reason!: string;
}
