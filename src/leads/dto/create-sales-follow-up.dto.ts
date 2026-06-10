import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class CreateSalesFollowUpDto {
  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsString()
  @IsNotEmpty()
  disposition: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  nextFollowUpDate?: string;
}
