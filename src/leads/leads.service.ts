import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { VerificationStatus } from '../common/enums';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async recordLead(customerId: string, providerId: string): Promise<{ phoneNumber: string; lead: LeadDocument }> {
    const provider = await this.providerModel.findById(providerId).exec();
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException('Provider is not verified');
    }
    const lead = await this.leadModel.create({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
    });
    const providerUser = await this.userModel.findById(provider.userId).exec();
    if (!providerUser) throw new NotFoundException('Provider user not found');
    return { phoneNumber: providerUser.phoneNumber, lead };
  }

  async getLeadsForProvider(providerId: string, userId: string): Promise<LeadDocument[]> {
    const profile = await this.providerModel.findOne({
      _id: providerId,
      userId: new Types.ObjectId(userId),
    }).exec();
    if (!profile) throw new ForbiddenException('Not your provider profile');
    return this.leadModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .populate('customerId', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as Promise<LeadDocument[]>;
  }

  async hasLead(customerId: string, providerId: string): Promise<boolean> {
    const count = await this.leadModel
      .countDocuments({
        customerId: new Types.ObjectId(customerId),
        providerId: new Types.ObjectId(providerId),
      })
      .exec();
    return count > 0;
  }

  async getLeadsForProviderByUserId(userId: string): Promise<LeadDocument[]> {
    const profile = await this.providerModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!profile) return [];
    return this.leadModel
      .find({ providerId: profile._id })
      .populate('customerId', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as Promise<LeadDocument[]>;
  }
}
