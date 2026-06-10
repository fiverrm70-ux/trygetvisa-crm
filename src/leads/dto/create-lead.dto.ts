import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  contactNo: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  alternateEmail?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  marriageDate?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsString()
  educationCourse?: string;

  @IsOptional()
  @IsString()
  job?: string;

  @IsOptional()
  @IsString()
  yearsOfExperience?: string;

  @IsOptional()
  @IsString()
  business?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  countryApplying?: string;

  @IsOptional()
  @IsString()
  schengenCountry?: string;

  @IsOptional()
  @IsString()
  nonSchengenCountry?: string;

  @IsOptional()
  @IsString()
  visaType?: string;

  @IsOptional()
  @IsString()
  applyingWithSpouse?: string;

  @IsOptional()
  @IsString()
  spouseDob?: string;

  @IsOptional()
  @IsString()
  spouseEducationStatus?: string;

  @IsOptional()
  @IsString()
  spouseWorkExperience?: string;

  @IsOptional()
  @IsString()
  processingFees?: string;

  @IsOptional()
  @IsString()
  amountPaid?: string;

  @IsOptional()
  @IsString()
  amountPending?: string;

  @IsOptional()
  @IsString()
  visaCopy?: string;

  @IsOptional()
  @IsString()
  visaStatus?: string;

  @IsOptional()
  @IsString()
  adminComment?: string;
}
