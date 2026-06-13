import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PortfolioItemDocument = PortfolioItem & Document;

@Schema({ timestamps: true })
export class PortfolioItem {
  @Prop({ type: Types.ObjectId, ref: 'ProviderProfile', required: true })
  providerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop({ type: Types.ObjectId, ref: 'ServiceCategory', default: null })
  categoryId: Types.ObjectId | null;

  @Prop({ default: null })
  completedAt: Date | null;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PortfolioItemSchema = SchemaFactory.createForClass(PortfolioItem);
PortfolioItemSchema.index({ providerId: 1, displayOrder: 1 });
