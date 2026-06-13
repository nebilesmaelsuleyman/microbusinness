import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import {
  ProviderVerificationDocument,
  ProviderVerificationDocumentDoc,
} from '../providers/schemas/provider-verification-document.schema';
import { ServiceCategory, ServiceCategoryDocument } from '../categories/schemas/service-category.schema';
import { JobRequest, JobRequestDocument } from '../jobs/schemas/job-request.schema';
import { ProviderSubscription, ProviderSubscriptionDocument } from '../subscriptions/schemas/provider-subscription.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../subscriptions/schemas/subscription-plan.schema';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';
import { CreatePlanDto } from '../subscriptions/dto/create-plan.dto';
import { VerificationStatus } from '../common/enums';
import { UserRole } from '../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
    @InjectModel(ProviderVerificationDocument.name)
    private verificationDocModel: Model<ProviderVerificationDocumentDoc>,
    @InjectModel(ServiceCategory.name) private categoryModel: Model<ServiceCategoryDocument>,
    @InjectModel(JobRequest.name) private jobModel: Model<JobRequestDocument>,
    @InjectModel(ProviderSubscription.name) private subscriptionModel: Model<ProviderSubscriptionDocument>,
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
  ) {}

  async getAllUsers(skip: number, limit: number) {
    return this.userModel.find().skip(skip).limit(limit).lean().exec();
  }

  async getAllProviders(skip: number, limit: number) {
    return this.providerModel
      .find()
      .populate('userId', 'name phoneNumber')
      .populate('serviceCategories')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
  }

  async setProviderVerification(providerId: string, status: 'approved' | 'rejected') {
    const profile = await this.providerModel.findByIdAndUpdate(
      providerId,
      { verificationStatus: status as VerificationStatus },
      { new: true },
    ).exec();
    if (!profile) throw new NotFoundException('Provider not found');
    return profile;
  }

  async getPendingVerificationDocuments() {
    return this.verificationDocModel
      .find({ status: VerificationStatus.PENDING })
      .populate('providerId')
      .sort({ uploadedAt: -1 })
      .lean()
      .exec();
  }

  async setDocumentStatus(docId: string, status: 'approved' | 'rejected') {
    const doc = await this.verificationDocModel
      .findByIdAndUpdate(docId, { status: status as VerificationStatus }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('Document not found');
    if (status === 'approved') {
      await this.providerModel.findByIdAndUpdate(doc.providerId, {
        verificationStatus: VerificationStatus.APPROVED,
      }).exec();
    }
    return doc;
  }

  async getCategories() {
    return this.categoryModel.find().lean().exec();
  }

  async createCategory(dto: CreateCategoryDto) {
    const cat = new this.categoryModel(dto);
    return cat.save();
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Category not found');
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
    const totalRevenue = subs.reduce((sum, s) => sum + ((s.planId as { price?: number })?.price ?? 0), 0);
    return {
      totalSubscriptions: subs.length,
      totalRevenue,
      activeSubscriptions: subs.filter((s) => new Date(s.endDate) >= new Date()).length,
    };
  }

  async createPlan(dto: CreatePlanDto) {
    return this.planModel.create(dto);
  }
}
