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
exports.ProvidersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const provider_profile_schema_1 = require("./schemas/provider-profile.schema");
const provider_verification_document_schema_1 = require("./schemas/provider-verification-document.schema");
const enums_1 = require("../common/enums");
const enums_2 = require("../common/enums");
let ProvidersService = class ProvidersService {
    constructor(providerModel, verificationDocModel) {
        this.providerModel = providerModel;
        this.verificationDocModel = verificationDocModel;
    }
    async create(userId, dto) {
        const existing = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (existing)
            throw new common_1.ForbiddenException('Provider profile already exists');
        const coordinates = dto.longitude != null && dto.latitude != null
            ? { type: 'Point', coordinates: [dto.longitude, dto.latitude] }
            : { type: 'Point', coordinates: [0, 0] };
        const created = new this.providerModel({
            userId: new mongoose_2.Types.ObjectId(userId),
            serviceCategories: dto.serviceCategories?.map((id) => new mongoose_2.Types.ObjectId(id)) ?? [],
            serviceDescription: dto.serviceDescription ?? '',
            yearsOfExperience: dto.yearsOfExperience ?? 0,
            serviceRadiusKm: dto.serviceRadiusKm ?? 10,
            pricingModel: dto.pricingModel,
            availabilitySchedule: dto.availabilitySchedule ?? {},
            coordinates,
        });
        return created.save();
    }
    async findByUserId(userId) {
        return this.providerModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .populate('serviceCategories')
            .exec();
    }
    async getProfile(userId, requestUserId, requestRole) {
        const profile = await this.providerModel
            .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
            .populate('serviceCategories')
            .populate('userId', 'name phoneNumber profilePhoto location')
            .lean()
            .exec();
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found');
        const profileObj = profile;
        if (profileObj.userId && profileObj.userId.toString?.() !== requestUserId && requestRole !== enums_2.UserRole.ADMIN) {
            delete profileObj.userId;
        }
        return profileObj;
    }
    async updateProfile(userId, dto) {
        const profile = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found');
        const update = { ...dto };
        if (dto.latitude != null && dto.longitude != null) {
            update.coordinates = { type: 'Point', coordinates: [dto.longitude, dto.latitude] };
        }
        if (dto.serviceCategories) {
            update.serviceCategories = dto.serviceCategories.map((id) => new mongoose_2.Types.ObjectId(id));
        }
        delete update.latitude;
        delete update.longitude;
        const updated = await this.providerModel
            .findByIdAndUpdate(profile._id, { $set: update }, { new: true })
            .exec();
        if (!updated)
            throw new common_1.NotFoundException('Provider profile not found');
        return updated;
    }
    async search(dto) {
        const filter = { verificationStatus: enums_1.VerificationStatus.APPROVED };
        if (dto.categoryId) {
            filter.serviceCategories = new mongoose_2.Types.ObjectId(dto.categoryId);
        }
        if (dto.minRating != null) {
            filter.ratingAverage = { $gte: dto.minRating };
        }
        if (dto.latitude != null && dto.longitude != null) {
            const maxDistanceMeters = (dto.maxDistanceKm ?? 50) * 1000;
            filter['coordinates'] = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [dto.longitude, dto.latitude],
                    },
                    $maxDistance: maxDistanceMeters,
                },
            };
        }
        const limit = Math.min(dto.limit ?? 20, 100);
        const skip = dto.skip ?? 0;
        return this.providerModel
            .find(filter)
            .populate('userId', 'name profilePhoto')
            .sort({ ratingAverage: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
    }
    async addVerificationDocument(providerId, documentType, documentUrl) {
        const doc = new this.verificationDocModel({
            providerId: new mongoose_2.Types.ObjectId(providerId),
            documentType,
            documentUrl,
        });
        return doc.save();
    }
    async getVerificationDocuments(providerId) {
        return this.verificationDocModel.find({ providerId: new mongoose_2.Types.ObjectId(providerId) }).exec();
    }
    async uploadVerificationDocument(userId, dto) {
        const profile = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found');
        return this.addVerificationDocument(profile._id.toString(), dto.documentType, dto.documentUrl);
    }
    async getMyVerificationDocuments(userId) {
        const profile = await this.providerModel.findOne({ userId: new mongoose_2.Types.ObjectId(userId) }).exec();
        if (!profile)
            return [];
        return this.getVerificationDocuments(profile._id.toString());
    }
};
exports.ProvidersService = ProvidersService;
exports.ProvidersService = ProvidersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(provider_profile_schema_1.ProviderProfile.name)),
    __param(1, (0, mongoose_1.InjectModel)(provider_verification_document_schema_1.ProviderVerificationDocument.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ProvidersService);
//# sourceMappingURL=providers.service.js.map