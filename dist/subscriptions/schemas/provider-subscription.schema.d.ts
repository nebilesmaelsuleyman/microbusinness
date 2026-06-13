import { Document, Types } from 'mongoose';
export type ProviderSubscriptionDocument = ProviderSubscription & Document;
export declare class ProviderSubscription {
    providerId: Types.ObjectId;
    planId: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    leadUsed: number;
}
export declare const ProviderSubscriptionSchema: import("mongoose").Schema<ProviderSubscription, import("mongoose").Model<ProviderSubscription, any, any, any, Document<unknown, any, ProviderSubscription, any, {}> & ProviderSubscription & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProviderSubscription, Document<unknown, {}, import("mongoose").FlatRecord<ProviderSubscription>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ProviderSubscription> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
