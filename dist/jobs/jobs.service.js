"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const job_request_schema_1 = require("./schemas/job-request.schema");
const provider_profile_schema_1 = require("../providers/schemas/provider-profile.schema");
const enums_1 = require("../common/enums");
const enums_2 = require("../common/enums");
let JobsService = class JobsService {
    constructor(jobModel, providerModel) {
        this.jobModel = jobModel;
        this.providerModel = providerModel;
    }
    async create(customerId, dto) {
        const job = new this.jobModel({
            customerId: new mongoose_2.Types.ObjectId(customerId),
            providerId: new mongoose_2.Types.ObjectId(dto.providerId),
            description: dto.description ?? '',
            scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
            status: enums_1.JobStatus.REQUESTED,
        });
        return job.save();
    }
    async findById(id) {
        const job = await this.jobModel.findById(id).populate('customerId providerId').exec();
        if (!job)
            throw new common_1.NotFoundException('Job request not found');
        return job;
    }
    async updateStatus(jobId, status, userId, role) {
        const job = await this.jobModel.findById(jobId).exec();
        if (!job)
            throw new common_1.NotFoundException('Job request not found');
        if (role === enums_2.UserRole.SERVICE_PROVIDER) {
            const profile = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
            if (!profile || job.providerId.toString() !== profile._id.toString()) {
                throw new common_1.ForbiddenException('Not your job');
            }
            if (![enums_1.JobStatus.ACCEPTED, enums_1.JobStatus.REJECTED].includes(status)) {
                throw new common_1.ForbiddenException('Provider can only accept or reject');
            }
        }
        else if (role === enums_2.UserRole.CUSTOMER) {
            if (job.customerId.toString() !== userId)
                throw new common_1.ForbiddenException('Not your job');
            if (status !== enums_1.JobStatus.CANCELLED) {
                throw new common_1.ForbiddenException('Customer can only cancel');
            }
        }
        job.status = status;
        return job.save();
    }
    async findByCustomer(customerId) {
        return this.jobModel
            .find({ customerId: new mongoose_2.Types.ObjectId(customerId) })
            .populate('providerId')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
    async findByProvider(providerId) {
        return this.jobModel
            .find({ providerId: new mongoose_2.Types.ObjectId(providerId) })
            .populate('customerId')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
    async findByProviderUserId(userId) {
        const profile = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!profile)
            return [];
        return this.findByProvider(profile._id.toString());
    }
    async getStats() {
        const stats = await this.jobModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        return Object.fromEntries(stats.map((s) => [s._id, s.count]));
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(job_request_schema_1.JobRequest.name)),
    __param(1, (0, mongoose_1.InjectModel)(provider_profile_schema_1.ProviderProfile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], JobsService);
//# sourceMappingURL=jobs.service.js.map