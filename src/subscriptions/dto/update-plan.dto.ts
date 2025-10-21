import { IsString, IsNumber, IsBoolean, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  leadLimit?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  visibilityBoost?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationDays?: number;
}
