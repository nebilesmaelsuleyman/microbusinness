import { IsEnum } from 'class-validator';
import { PaymentStatus } from '../../common/enums';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}
