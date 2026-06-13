import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CompleteJobDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  finalPrice?: number;

  @IsString()
  @IsOptional()
  completionNotes?: string;
}

export class QuoteJobDto {
  @IsNumber()
  @Min(0)
  quotedPrice: number;
}
