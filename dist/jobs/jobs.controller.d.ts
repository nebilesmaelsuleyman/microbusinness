import { JobsService } from './jobs.service';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class JobsController {
    private readonly jobsService;
    constructor(jobsService: JobsService);
    create(customerId: string, dto: CreateJobRequestDto): Promise<import("./schemas/job-request.schema").JobRequestDocument>;
    myJobs(payload: JwtPayload): Promise<import("./schemas/job-request.schema").JobRequestDocument[]>;
    findOne(id: string, payload: JwtPayload): Promise<import("./schemas/job-request.schema").JobRequestDocument>;
    updateStatus(id: string, dto: UpdateJobStatusDto, payload: JwtPayload): Promise<import("./schemas/job-request.schema").JobRequestDocument>;
}
