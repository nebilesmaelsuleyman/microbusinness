import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ type: String, required: true, select: false })
  jtiHash: string;

  @Prop({ type: String, default: null })
  userAgent: string | null;

  @Prop({ type: String, default: null })
  ip: string | null;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  @Prop({ default: false })
  revoked: boolean;

  @Prop({ type: String, default: null })
  deviceName: string | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ user: 1 });
SessionSchema.index({ jtiHash: 1 });
