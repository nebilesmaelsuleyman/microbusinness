import { Document } from 'mongoose';
export type ServiceCategoryDocument = ServiceCategory & Document;
export declare class ServiceCategory {
    name: string;
    description: string;
}
export declare const ServiceCategorySchema: import("mongoose").Schema<ServiceCategory, import("mongoose").Model<ServiceCategory, any, any, any, Document<unknown, any, ServiceCategory, any, {}> & ServiceCategory & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ServiceCategory, Document<unknown, {}, import("mongoose").FlatRecord<ServiceCategory>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<ServiceCategory> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
