import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({ timestamps: true })
export class SubscriptionPlan {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  leadLimit: number;

  @Prop({ default: false })
  visibilityBoost: boolean;

  @Prop({ required: true })
  durationDays: number;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
