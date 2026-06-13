import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceCategoryDocument = ServiceCategory & Document;

@Schema({ timestamps: true })
export class ServiceCategory {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;
}

export const ServiceCategorySchema = SchemaFactory.createForClass(ServiceCategory);
