import { IsArray, IsEnum, IsNumber } from 'class-validator';

import { AssignLeadType } from './assign-lead.dto';

export class BulkAssignLeadsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  leadIds: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  employeeIds: number[];

  @IsEnum(AssignLeadType)
  type: AssignLeadType;
}
