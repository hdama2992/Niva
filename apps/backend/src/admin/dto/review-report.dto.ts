import { IsBoolean, IsEnum } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class ReviewReportDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsBoolean()
  confirmed!: boolean;
}
