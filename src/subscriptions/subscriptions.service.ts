import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubscriptionPlan, SubscriptionPlanDocument } from './schemas/subscription-plan.schema';
import { ProviderSubscription, ProviderSubscriptionDocument } from './schemas/provider-subscription.schema';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
    @InjectModel(ProviderSubscription.name) private subModel: Model<ProviderSubscriptionDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
  ) {}

  async createPlan(dto: CreatePlanDto) {
    const plan = new this.planModel(dto);
    return plan.save();
  }

  async findAllPlans() {
    return this.planModel.find().lean().exec();
  }

  async subscribe(userId: string, planId: string): Promise<ProviderSubscriptionDocument> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!profile) throw new NotFoundException('Provider profile not found');
    const providerProfileId = profile._id.toString();
    const plan = await this.planModel.findById(planId).exec();
    if (!plan) throw new NotFoundException('Plan not found');
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);
    const sub = new this.subModel({
      providerId: new Types.ObjectId(providerProfileId),
      planId: new Types.ObjectId(planId),
      startDate,
      endDate,
    });
    return sub.save();
  }

  async getActiveSubscription(userId: string) {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!profile) return null;
    const providerProfileId = profile._id.toString();
    const now = new Date();
    return this.subModel
      .findOne({
        providerId: new Types.ObjectId(providerProfileId),
        endDate: { $gte: now },
      })
      .populate('planId')
      .sort({ endDate: -1 })
      .lean()
      .exec();
  }

  async incrementLeadUsed(providerId: string): Promise<boolean> {
    const sub = await this.subModel.findOne({
      providerId: new Types.ObjectId(providerId),
      endDate: { $gte: new Date() },
    }).sort({ endDate: -1 }).exec();
    if (!sub) return false;
    const plan = await this.planModel.findById(sub.planId).exec();
    if (!plan || sub.leadUsed >= plan.leadLimit) return false;
    sub.leadUsed += 1;
    await sub.save();
    return true;
  }
}
