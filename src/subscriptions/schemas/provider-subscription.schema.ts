import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProviderSubscriptionDocument = ProviderSubscription & Document;

@Schema({ timestamps: true })
export class ProviderSubscription {
  @Prop({ type: Types.ObjectId, ref: 'ProviderProfile', required: true })
  providerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', required: true })
  planId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: 0 })
  leadUsed: number;
}

export const ProviderSubscriptionSchema = SchemaFactory.createForClass(ProviderSubscription);
ProviderSubscriptionSchema.index({ providerId: 1 });
ProviderSubscriptionSchema.index({ endDate: 1 });
