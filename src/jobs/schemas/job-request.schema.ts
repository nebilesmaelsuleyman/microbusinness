import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { JobStatus } from '../../common/enums';

export type JobRequestDocument = JobRequest & Document;

@Schema({ timestamps: true })
export class JobRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProviderProfile', required: true })
  providerId: Types.ObjectId;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: null })
  scheduledDate: Date | null;

  @Prop({ enum: Object.values(JobStatus), default: JobStatus.REQUESTED })
  status: JobStatus;

  @Prop({ default: null })
  quotedPrice: number | null;

  @Prop({ default: null })
  finalPrice: number | null;

  @Prop({ default: null })
  completedAt: Date | null;

  @Prop({ default: '' })
  completionNotes: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const JobRequestSchema = SchemaFactory.createForClass(JobRequest);
JobRequestSchema.index({ customerId: 1 });
JobRequestSchema.index({ providerId: 1 });
JobRequestSchema.index({ status: 1 });
