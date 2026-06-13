import { IsArray, IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePortfolioItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}

export class UpdatePortfolioItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  imageUrls?: string[];

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}
