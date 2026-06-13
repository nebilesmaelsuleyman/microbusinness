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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const subscription_plan_schema_1 = require("./schemas/subscription-plan.schema");
const provider_subscription_schema_1 = require("./schemas/provider-subscription.schema");
const provider_profile_schema_1 = require("../providers/schemas/provider-profile.schema");
let SubscriptionsService = class SubscriptionsService {
    constructor(planModel, subModel, providerModel) {
        this.planModel = planModel;
        this.subModel = subModel;
        this.providerModel = providerModel;
    }
    async createPlan(dto) {
        const plan = new this.planModel(dto);
        return plan.save();
    }
    async findAllPlans() {
        return this.planModel.find().lean().exec();
    }
    async subscribe(userId, planId) {
        const profile = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found');
        const providerProfileId = profile._id.toString();
        const plan = await this.planModel.findById(planId).exec();
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.durationDays);
        const sub = new this.subModel({
            providerId: new mongoose_2.Types.ObjectId(providerProfileId),
            planId: new mongoose_2.Types.ObjectId(planId),
            startDate,
            endDate,
        });
        return sub.save();
    }
    async getActiveSubscription(userId) {
        const profile = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!profile)
            return null;
        const providerProfileId = profile._id.toString();
        const now = new Date();
        return this.subModel
            .findOne({
            providerId: new mongoose_2.Types.ObjectId(providerProfileId),
            endDate: { $gte: now },
        })
            .populate('planId')
            .sort({ endDate: -1 })
            .lean()
            .exec();
    }
    async incrementLeadUsed(providerId) {
        const sub = await this.subModel.findOne({
            providerId: new mongoose_2.Types.ObjectId(providerId),
            endDate: { $gte: new Date() },
        }).sort({ endDate: -1 }).exec();
        if (!sub)
            return false;
        const plan = await this.planModel.findById(sub.planId).exec();
        if (!plan || sub.leadUsed >= plan.leadLimit)
            return false;
        sub.leadUsed += 1;
        await sub.save();
        return true;
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(subscription_plan_schema_1.SubscriptionPlan.name)),
    __param(1, (0, mongoose_1.InjectModel)(provider_subscription_schema_1.ProviderSubscription.name)),
    __param(2, (0, mongoose_1.InjectModel)(provider_profile_schema_1.ProviderProfile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map