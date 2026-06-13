import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateJobRequestDto {
  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}
