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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const provider_profile_schema_1 = require("../providers/schemas/provider-profile.schema");
const provider_verification_document_schema_1 = require("../providers/schemas/provider-verification-document.schema");
const service_category_schema_1 = require("../categories/schemas/service-category.schema");
const job_request_schema_1 = require("../jobs/schemas/job-request.schema");
const provider_subscription_schema_1 = require("../subscriptions/schemas/provider-subscription.schema");
const subscription_plan_schema_1 = require("../subscriptions/schemas/subscription-plan.schema");
const enums_1 = require("../common/enums");
let AdminService = class AdminService {
    constructor(userModel, providerModel, verificationDocModel, categoryModel, jobModel, subscriptionModel, planModel) {
        this.userModel = userModel;
        this.providerModel = providerModel;
        this.verificationDocModel = verificationDocModel;
        this.categoryModel = categoryModel;
        this.jobModel = jobModel;
        this.subscriptionModel = subscriptionModel;
        this.planModel = planModel;
    }
    async getAllUsers(skip, limit) {
        return this.userModel.find().skip(skip).limit(limit).lean().exec();
    }
    async getAllProviders(skip, limit) {
        return this.providerModel
            .find()
            .populate('userId', 'name phoneNumber')
            .populate('serviceCategories')
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
    }
    async setProviderVerification(providerId, status) {
        const profile = await this.providerModel.findByIdAndUpdate(providerId, { verificationStatus: status }, { new: true }).exec();
        if (!profile)
            throw new common_1.NotFoundException('Provider not found');
        return profile;
    }
    async getPendingVerificationDocuments() {
        return this.verificationDocModel
            .find({ status: enums_1.VerificationStatus.PENDING })
            .populate('providerId')
            .sort({ uploadedAt: -1 })
            .lean()
            .exec();
    }
    async setDocumentStatus(docId, status) {
        const doc = await this.verificationDocModel
            .findByIdAndUpdate(docId, { status: status }, { new: true })
            .exec();
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        if (status === 'approved') {
            await this.providerModel.findByIdAndUpdate(doc.providerId, {
                verificationStatus: enums_1.VerificationStatus.APPROVED,
            }).exec();
        }
        return doc;
    }
    async getCategories() {
        return this.categoryModel.find().lean().exec();
    }
    async createCategory(dto) {
        const cat = new this.categoryModel(dto);
        return cat.save();
    }
    async updateCategory(id, dto) {
        const updated = await this.categoryModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Category not found');
        return updated;
    }
    async getJobStats() {
        const stats = await this.jobModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        return Object.fromEntries(stats.map((s) => [s._id, s.count]));
    }
    async getRevenueMetrics() {
        const subs = await this.subscriptionModel
            .find()
            .populate('planId')
            .lean()
            .exec();
        const totalRevenue = subs.reduce((sum, s) => sum + (s.planId?.price ?? 0), 0);
        return {
            totalSubscriptions: subs.length,
            totalRevenue,
            activeSubscriptions: subs.filter((s) => new Date(s.endDate) >= new Date()).length,
        };
    }
    async createPlan(dto) {
        return this.planModel.create(dto);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(provider_profile_schema_1.ProviderProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(provider_verification_document_schema_1.ProviderVerificationDocument.name)),
    __param(3, (0, mongoose_1.InjectModel)(service_category_schema_1.ServiceCategory.name)),
    __param(4, (0, mongoose_1.InjectModel)(job_request_schema_1.JobRequest.name)),
    __param(5, (0, mongoose_1.InjectModel)(provider_subscription_schema_1.ProviderSubscription.name)),
    __param(6, (0, mongoose_1.InjectModel)(subscription_plan_schema_1.SubscriptionPlan.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], AdminService);
//# sourceMappingURL=admin.service.js.map