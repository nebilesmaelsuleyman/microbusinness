import { IsNumber, IsString, Min, Max, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsMongoId()
  jobId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
