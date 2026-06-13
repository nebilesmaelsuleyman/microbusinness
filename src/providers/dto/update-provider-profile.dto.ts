import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PricingModel } from '../../common/enums';

export class UpdateProviderProfileDto {
  @IsArray()
  @IsOptional()
  serviceCategories?: string[];

  @IsString()
  @IsOptional()
  serviceDescription?: string;

  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  yearsOfExperience?: number;

  @IsNumber()
  @Min(1)
  @Max(500)
  @IsOptional()
  @Type(() => Number)
  serviceRadiusKm?: number;

  @IsEnum(PricingModel)
  @IsOptional()
  pricingModel?: PricingModel;

  @IsObject()
  @IsOptional()
  availabilitySchedule?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;
}
