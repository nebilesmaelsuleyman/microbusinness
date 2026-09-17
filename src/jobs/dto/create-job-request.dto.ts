import { IsString, IsOptional, IsDateString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJobRequestDto {
  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quoteAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
