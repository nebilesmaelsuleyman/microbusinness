import { Document } from 'mongoose';
export type OtpSessionDocument = OtpSession & Document;
export declare class OtpSession {
    phoneNumber: string;
    otp: string;
    expiresAt: Date;
    verified: boolean;
}
export declare const OtpSessionSchema: import("mongoose").Schema<OtpSession, import("mongoose").Model<OtpSession, any, any, any, Document<unknown, any, OtpSession, any, {}> & OtpSession & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OtpSession, Document<unknown, {}, import("mongoose").FlatRecord<OtpSession>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OtpSession> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
