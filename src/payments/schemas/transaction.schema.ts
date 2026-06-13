import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentType } from '../../common/enums';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  payerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  payeeId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'JobRequest', default: null })
  jobId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'ProviderSubscription', default: null })
  subscriptionId: Types.ObjectId | null;

  @Prop({ enum: Object.values(PaymentType), required: true })
  type: PaymentType;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  externalRef: string;

  @Prop({ default: null })
  paidAt: Date | null;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ payerId: 1, createdAt: -1 });
TransactionSchema.index({ payeeId: 1, createdAt: -1 });
TransactionSchema.index({ jobId: 1 });
TransactionSchema.index({ status: 1 });
