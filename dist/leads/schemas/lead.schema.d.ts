import { Document, Types } from 'mongoose';
export type LeadDocument = Lead & Document;
export declare class Lead {
    customerId: Types.ObjectId;
    providerId: Types.ObjectId;
    createdAt: Date;
}
export declare const LeadSchema: import("mongoose").Schema<Lead, import("mongoose").Model<Lead, any, any, any, Document<unknown, any, Lead, any, {}> & Lead & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Lead, Document<unknown, {}, import("mongoose").FlatRecord<Lead>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Lead> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
