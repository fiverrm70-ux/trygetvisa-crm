import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProcessDocumentDto {
  @IsString()
  documentName: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsIn(['PENDING', 'ACCEPTED', 'REJECTED'])
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  remarks?: string;
}
