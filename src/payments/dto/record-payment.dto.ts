import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentType } from '../../common/enums';

export class RecordPaymentDto {
  @IsEnum(PaymentType)
  type: PaymentType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsMongoId()
  @IsOptional()
  jobId?: string;

  @IsMongoId()
  @IsOptional()
  invoiceId?: string;

  @IsMongoId()
  @IsOptional()
  payeeId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  externalRef?: string;
}
