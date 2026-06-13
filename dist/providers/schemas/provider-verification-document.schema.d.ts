import { Document, Types } from 'mongoose';
import { VerificationStatus } from '../../common/enums';
export type ProviderVerificationDocumentDoc = ProviderVerificationDocument & Document;
export declare class ProviderVerificationDocument {
    providerId: Types.ObjectId;
    documentType: string;
    documentUrl: string;
    status: VerificationStatus;
    uploadedAt: Date;
}
export declare const ProviderVerificationDocumentSchema: import("mongoose").Schema<ProviderVerificationDocument, import("mongoose").Model<ProviderVerificationDocument, any, any, any, Document<unknown, any, ProviderVerificationDocument, any, {}> & ProviderVerificationDocument & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProviderVerificationDocument, Document<unknown, {}, import("mongoose").FlatRecord<ProviderVerificationDocument>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ProviderVerificationDocument> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
