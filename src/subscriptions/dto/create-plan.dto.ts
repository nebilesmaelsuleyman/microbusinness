import { IsString, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  leadLimit: number;

  @IsBoolean()
  @Type(() => Boolean)
  visibilityBoost: boolean;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationDays: number;
}
