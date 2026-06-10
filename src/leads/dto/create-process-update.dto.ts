import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateProcessUpdateDto {
  @IsIn(['ASSIGNED_TO_PROCESS', 'PROCESS_RUNNING', 'PROCESS_COMPLETED'])
  status: 'ASSIGNED_TO_PROCESS' | 'PROCESS_RUNNING' | 'PROCESS_COMPLETED';

  @IsIn(['PENDING', 'YES', 'NO'])
  processDoneStatus: 'PENDING' | 'YES' | 'NO';

  @IsOptional()
  @IsString()
  notes?: string;
}
