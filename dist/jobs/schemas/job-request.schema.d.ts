import { Document, Types } from 'mongoose';
import { JobStatus } from '../../common/enums';
export type JobRequestDocument = JobRequest & Document;
export declare class JobRequest {
    customerId: Types.ObjectId;
    providerId: Types.ObjectId;
    description: string;
    scheduledDate: Date | null;
    status: JobStatus;
    createdAt: Date;
}
export declare const JobRequestSchema: import("mongoose").Schema<JobRequest, import("mongoose").Model<JobRequest, any, any, any, Document<unknown, any, JobRequest, any, {}> & JobRequest & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, JobRequest, Document<unknown, {}, import("mongoose").FlatRecord<JobRequest>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<JobRequest> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
