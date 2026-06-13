import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProviderProfile, ProviderProfileDocument } from './schemas/provider-profile.schema';
import {
  ProviderVerificationDocument,
  ProviderVerificationDocumentDoc,
} from './schemas/provider-verification-document.schema';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { VerificationStatus } from '../common/enums';
import { UserRole } from '../common/enums';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
    @InjectModel(ProviderVerificationDocument.name)
    private verificationDocModel: Model<ProviderVerificationDocumentDoc>,
  ) {}

  async create(userId: string, dto: CreateProviderProfileDto): Promise<ProviderProfileDocument> {
    const existing = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (existing) throw new ForbiddenException('Provider profile already exists');
    const coordinates =
      dto.longitude != null && dto.latitude != null
        ? { type: 'Point' as const, coordinates: [dto.longitude, dto.latitude] }
        : { type: 'Point' as const, coordinates: [0, 0] };
    const created = new this.providerModel({
      userId: new Types.ObjectId(userId),
      serviceCategories: dto.serviceCategories?.map((id) => new Types.ObjectId(id)) ?? [],
      serviceDescription: dto.serviceDescription ?? '',
      yearsOfExperience: dto.yearsOfExperience ?? 0,
      serviceRadiusKm: dto.serviceRadiusKm ?? 10,
      pricingModel: dto.pricingModel,
      availabilitySchedule: dto.availabilitySchedule ?? {},
      coordinates,
    });
    return created.save();
  }

  async findByUserId(userId: string): Promise<ProviderProfileDocument | null> {
    return this.providerModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('serviceCategories')
      .exec();
  }

  async getProfile(userId: string, requestUserId: string, requestRole: string): Promise<ProviderProfileDocument> {
    const profile = await this.providerModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('serviceCategories')
      .populate('userId', 'name phoneNumber profilePhoto location')
      .lean()
      .exec();
    if (!profile) throw new NotFoundException('Provider profile not found');
    const profileObj = profile as Record<string, unknown>;
    if (profileObj.userId && (profileObj.userId as { toString?: () => string }).toString?.() !== requestUserId && requestRole !== UserRole.ADMIN) {
      delete profileObj.userId;
    }
    return profileObj as unknown as ProviderProfileDocument;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProviderProfileDto,
  ): Promise<ProviderProfileDocument> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!profile) throw new NotFoundException('Provider profile not found');
    const update: Record<string, unknown> = { ...dto };
    if (dto.latitude != null && dto.longitude != null) {
      update.coordinates = { type: 'Point', coordinates: [dto.longitude, dto.latitude] };
    }
    if (dto.serviceCategories) {
      update.serviceCategories = dto.serviceCategories.map((id) => new Types.ObjectId(id));
    }
    delete update.latitude;
    delete update.longitude;
    const updated = await this.providerModel
      .findByIdAndUpdate(profile._id, { $set: update }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Provider profile not found');
    return updated;
  }

  async search(dto: SearchProvidersDto): Promise<ProviderProfileDocument[]> {
    const filter: Record<string, unknown> = { verificationStatus: VerificationStatus.APPROVED };
    if (dto.categoryId) {
      filter.serviceCategories = new Types.ObjectId(dto.categoryId);
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
      .exec() as unknown as Promise<ProviderProfileDocument[]>;
  }

  async addVerificationDocument(
    providerId: string,
    documentType: string,
    documentUrl: string,
  ): Promise<ProviderVerificationDocumentDoc> {
    const doc = new this.verificationDocModel({
      providerId: new Types.ObjectId(providerId),
      documentType,
      documentUrl,
    });
    return doc.save();
  }

  async getVerificationDocuments(providerId: string): Promise<ProviderVerificationDocumentDoc[]> {
    return this.verificationDocModel.find({ providerId: new Types.ObjectId(providerId) }).exec();
  }

  async uploadVerificationDocument(
    userId: string,
    dto: { documentType: string; documentUrl: string },
  ): Promise<ProviderVerificationDocumentDoc> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!profile) throw new NotFoundException('Provider profile not found');
    return this.addVerificationDocument(profile._id.toString(), dto.documentType, dto.documentUrl);
  }

  async getMyVerificationDocuments(userId: string): Promise<ProviderVerificationDocumentDoc[]> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!profile) return [];
    return this.getVerificationDocuments(profile._id.toString());
  }
}
