import { Model } from 'mongoose';
import { JobRequestDocument } from './schemas/job-request.schema';
import { ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { JobStatus } from '../common/enums';
export declare class JobsService {
    private jobModel;
    private providerModel;
    constructor(jobModel: Model<JobRequestDocument>, providerModel: Model<ProviderProfileDocument>);
    create(customerId: string, dto: CreateJobRequestDto): Promise<JobRequestDocument>;
    findById(id: string): Promise<JobRequestDocument>;
    updateStatus(jobId: string, status: JobStatus, userId: string, role: string): Promise<JobRequestDocument>;
    findByCustomer(customerId: string): Promise<JobRequestDocument[]>;
    findByProvider(providerId: string): Promise<JobRequestDocument[]>;
    findByProviderUserId(userId: string): Promise<JobRequestDocument[]>;
    getStats(): Promise<Record<string, number>>;
}
