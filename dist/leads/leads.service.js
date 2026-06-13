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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const lead_schema_1 = require("./schemas/lead.schema");
const provider_profile_schema_1 = require("../providers/schemas/provider-profile.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const enums_1 = require("../common/enums");
let LeadsService = class LeadsService {
    constructor(leadModel, providerModel, userModel) {
        this.leadModel = leadModel;
        this.providerModel = providerModel;
        this.userModel = userModel;
    }
    async recordLead(customerId, providerId) {
        const provider = await this.providerModel.findById(providerId).exec();
        if (!provider)
            throw new common_1.NotFoundException('Provider not found');
        if (provider.verificationStatus !== enums_1.VerificationStatus.APPROVED) {
            throw new common_1.ForbiddenException('Provider is not verified');
        }
        const lead = await this.leadModel.create({
            customerId: new mongoose_2.Types.ObjectId(customerId),
            providerId: new mongoose_2.Types.ObjectId(providerId),
        });
        const providerUser = await this.userModel.findById(provider.userId).exec();
        if (!providerUser)
            throw new common_1.NotFoundException('Provider user not found');
        return { phoneNumber: providerUser.phoneNumber, lead };
    }
    async getLeadsForProvider(providerId, userId) {
        const profile = await this.providerModel.findOne({
            _id: providerId,
            userId: new mongoose_2.Types.ObjectId(userId),
        }).exec();
        if (!profile)
            throw new common_1.ForbiddenException('Not your provider profile');
        return this.leadModel
            .find({ providerId: new mongoose_2.Types.ObjectId(providerId) })
            .populate('customerId', 'name phoneNumber')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
    async hasLead(customerId, providerId) {
        const count = await this.leadModel
            .countDocuments({
            customerId: new mongoose_2.Types.ObjectId(customerId),
            providerId: new mongoose_2.Types.ObjectId(providerId),
        })
            .exec();
        return count > 0;
    }
    async getLeadsForProviderByUserId(userId) {
        const profile = await this.providerModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .exec();
        if (!profile)
            return [];
        return this.leadModel
            .find({ providerId: profile._id })
            .populate('customerId', 'name phoneNumber')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(lead_schema_1.Lead.name)),
    __param(1, (0, mongoose_1.InjectModel)(provider_profile_schema_1.ProviderProfile.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], LeadsService);
//# sourceMappingURL=leads.service.js.map