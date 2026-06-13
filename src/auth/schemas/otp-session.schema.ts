import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpSessionDocument = OtpSession & Document;

@Schema({ timestamps: true })
export class OtpSession {
  @Prop({ required: true, index: true })
  phoneNumber: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, default: () => Date.now() })
  expiresAt: Date;

  @Prop({ default: false })
  verified: boolean;
}

export const OtpSessionSchema = SchemaFactory.createForClass(OtpSession);
OtpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
