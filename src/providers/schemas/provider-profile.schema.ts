import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VerificationStatus, PricingModel } from '../../common/enums';

export type ProviderProfileDocument = ProviderProfile & Document;

@Schema({ timestamps: true })
export class ProviderProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'ServiceCategory', default: [] })
  serviceCategories: Types.ObjectId[];

  @Prop({ default: '' })
  serviceDescription: string;

  @Prop({ default: 0 })
  yearsOfExperience: number;

  @Prop({ default: 10 })
  serviceRadiusKm: number;

  @Prop({ enum: Object.values(PricingModel), default: PricingModel.QUOTE })
  pricingModel: PricingModel;

  @Prop({ type: Object, default: {} })
  availabilitySchedule: Record<string, unknown>;

  @Prop({ enum: Object.values(VerificationStatus), default: VerificationStatus.PENDING })
  verificationStatus: VerificationStatus;

  @Prop({ default: 0 })
  ratingAverage: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({
    type: {
      city: { type: String, default: null },
      formattedAddress: { type: String, default: null },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    default: null,
  })
  location: {
    city?: string | null;
    formattedAddress?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: null,
    },
  })
  coordinates: { type: 'Point'; coordinates: [number, number] } | null;
}

export const ProviderProfileSchema = SchemaFactory.createForClass(ProviderProfile);
ProviderProfileSchema.index({ coordinates: '2dsphere' });
ProviderProfileSchema.index({ userId: 1 }, { unique: true });
ProviderProfileSchema.index({ verificationStatus: 1 });
ProviderProfileSchema.index({ serviceCategories: 1 });
