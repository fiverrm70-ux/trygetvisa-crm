import { IsEnum, IsNumber } from 'class-validator';

export enum AssignLeadType {
  SALES = 'SALES',
  PROCESS = 'PROCESS',
  CLIENT = 'CLIENT',
}

export class AssignLeadDto {
  @IsNumber()
  employeeId: number;

  @IsEnum(AssignLeadType)
  type: AssignLeadType;
}
