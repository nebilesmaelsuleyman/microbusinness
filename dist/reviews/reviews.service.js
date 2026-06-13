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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const review_schema_1 = require("./schemas/review.schema");
const leads_service_1 = require("../leads/leads.service");
const provider_profile_schema_1 = require("../providers/schemas/provider-profile.schema");
let ReviewsService = class ReviewsService {
    constructor(reviewModel, providerModel, leadsService) {
        this.reviewModel = reviewModel;
        this.providerModel = providerModel;
        this.leadsService = leadsService;
    }
    async create(customerId, providerId, dto) {
        const hasLead = await this.leadsService.hasLead(customerId, providerId);
        if (!hasLead)
            throw new common_1.ForbiddenException('You can only review providers you have contacted');
        const existing = await this.reviewModel.findOne({
            customerId: new mongoose_2.Types.ObjectId(customerId),
            providerId: new mongoose_2.Types.ObjectId(providerId),
        }).exec();
        if (existing)
            throw new common_1.ForbiddenException('You have already reviewed this provider');
        const review = new this.reviewModel({
            customerId: new mongoose_2.Types.ObjectId(customerId),
            providerId: new mongoose_2.Types.ObjectId(providerId),
            rating: dto.rating,
            comment: dto.comment ?? '',
        });
        await review.save();
        await this.updateProviderRating(providerId);
        return review;
    }
    async updateProviderRating(providerId) {
        const stats = await this.reviewModel.aggregate([
            { $match: { providerId: new mongoose_2.Types.ObjectId(providerId) } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        if (stats.length) {
            await this.providerModel.findByIdAndUpdate(providerId, {
                ratingAverage: Math.round(stats[0].avg * 10) / 10,
                reviewCount: stats[0].count,
            }).exec();
        }
    }
    async findByProvider(providerId) {
        return this.reviewModel
            .find({ providerId: new mongoose_2.Types.ObjectId(providerId) })
            .populate('customerId', 'name')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __param(1, (0, mongoose_1.InjectModel)(provider_profile_schema_1.ProviderProfile.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        leads_service_1.LeadsService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map