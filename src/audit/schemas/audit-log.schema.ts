import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  // The admin who performed the action.
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  actorId: Types.ObjectId | null;

  @Prop({ default: '' })
  actorPhone: string;

  // HTTP method + route that was hit (e.g. DELETE /api/admin/users/:id).
  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  path: string;

  // A short human label, e.g. "Suspended user" or "Deleted review".
  @Prop({ default: '' })
  action: string;

  // Route params + sanitized body for context (no secrets).
  @Prop({ type: Object, default: {} })
  meta: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ actorId: 1 });
