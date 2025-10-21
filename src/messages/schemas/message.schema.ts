import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 4000 })
  body: string;

  // null until the recipient has read the message.
  @Prop({ type: Date, default: null })
  readAt: Date | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
// Fast thread lookups in either direction, newest first.
MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, readAt: 1 });
