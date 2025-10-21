import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VerificationStatus } from '../../common/enums';

export type ProviderVerificationDocumentDoc = ProviderVerificationDocument & Document;

@Schema({ timestamps: true })
export class ProviderVerificationDocument {
  @Prop({ type: Types.ObjectId, ref: 'ProviderProfile', required: true })
  providerId: Types.ObjectId;

  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true })
  documentUrl: string;

  @Prop({
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const ProviderVerificationDocumentSchema = SchemaFactory.createForClass(
  ProviderVerificationDocument,
);
ProviderVerificationDocumentSchema.index({ providerId: 1 });
