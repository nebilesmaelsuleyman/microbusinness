import { Document, Types } from 'mongoose';
import { VerificationStatus, PricingModel } from '../../common/enums';
export type ProviderProfileDocument = ProviderProfile & Document;
export declare class ProviderProfile {
    userId: Types.ObjectId;
    serviceCategories: Types.ObjectId[];
    serviceDescription: string;
    yearsOfExperience: number;
    serviceRadiusKm: number;
    pricingModel: PricingModel;
    availabilitySchedule: Record<string, unknown>;
    verificationStatus: VerificationStatus;
    ratingAverage: number;
    reviewCount: number;
    coordinates: {
        type: 'Point';
        coordinates: [number, number];
    };
}
export declare const ProviderProfileSchema: import("mongoose").Schema<ProviderProfile, import("mongoose").Model<ProviderProfile, any, any, any, Document<unknown, any, ProviderProfile, any, {}> & ProviderProfile & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProviderProfile, Document<unknown, {}, import("mongoose").FlatRecord<ProviderProfile>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ProviderProfile> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
