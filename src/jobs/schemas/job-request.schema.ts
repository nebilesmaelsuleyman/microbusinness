import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { JobStatus, PaymentStatus } from '../../common/enums';

export type JobRequestDocument = JobRequest & Document;

@Schema({ timestamps: true })
export class JobRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProviderProfile', required: true })
  providerId: Types.ObjectId;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Date, default: null })
  scheduledDate: Date | null;

  @Prop({ default: 0 })
  quoteAmount: number;

  @Prop({ default: 'ETB' })
  currency: string;

  @Prop({ enum: Object.values(JobStatus), default: JobStatus.REQUESTED })
  status: JobStatus;

  @Prop({ enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Date, default: null })
  paidAt: Date | null;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const JobRequestSchema = SchemaFactory.createForClass(JobRequest);
JobRequestSchema.index({ customerId: 1 });
JobRequestSchema.index({ providerId: 1 });
JobRequestSchema.index({ status: 1 });
JobRequestSchema.index({ paymentStatus: 1 });
