import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { ProviderSubscription, ProviderSubscriptionDocument } from '../subscriptions/schemas/provider-subscription.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../subscriptions/schemas/subscription-plan.schema';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';
import { CreatePlanDto } from '../subscriptions/dto/create-plan.dto';
import { UpdatePlanDto } from '../subscriptions/dto/update-plan.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
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
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(ProviderSubscription.name) private subscriptionModel: Model<ProviderSubscriptionDocument>,
    @InjectModel(SubscriptionPlan.name) private planModel: Model<SubscriptionPlanDocument>,
  ) {}

  /* ----------------------------------------------------------------- Users */

  async getAllUsers(skip: number, limit: number, role?: string, search?: string) {
    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async setUserRole(userId: string, role: string) {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException('Invalid role');
    }
    const user = await this.userModel
      .findByIdAndUpdate(userId, { role: role as UserRole }, { new: true })
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setUserActive(userId: string, isActive: boolean) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { isActive }, { new: true })
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(userId: string, dto: UpdateAdminUserDto) {
    const update: Record<string, string> = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.phoneNumber !== undefined) update.phoneNumber = dto.phoneNumber.trim();
    if (dto.email !== undefined) update.email = dto.email.trim().toLowerCase();
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    // Cascade: remove the provider profile + verification docs tied to this user.
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (profile) {
      await this.verificationDocModel.deleteMany({ providerId: profile._id }).exec();
      await this.providerModel.deleteOne({ _id: profile._id }).exec();
    }
    await this.userModel.deleteOne({ _id: userId }).exec();
    return { deleted: true };
  }

  /* ------------------------------------------------------------- Providers */

  async getAllProviders(skip: number, limit: number) {
    const [items, total] = await Promise.all([
      this.providerModel
        .find()
        .populate('userId', 'name phoneNumber')
        .populate('serviceCategories')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.providerModel.countDocuments().exec(),
    ]);
    return { items, total };
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

  async getVerificationDocuments(status?: VerificationStatus) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    return this.verificationDocModel
      .find(filter)
      .populate({ path: 'providerId', populate: { path: 'userId', select: 'name phoneNumber profilePhoto' } })
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

  /* --------------------------------------------------------------- Reviews */

  async getReviews(skip: number, limit: number) {
    const [items, total] = await Promise.all([
      this.reviewModel
        .find()
        .populate('customerId', 'name phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  async deleteReview(reviewId: string) {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) throw new NotFoundException('Review not found');
    const providerId = review.providerId;
    await this.reviewModel.deleteOne({ _id: reviewId }).exec();
    // Recompute the provider's aggregate rating after removal.
    const stats = await this.reviewModel.aggregate([
      { $match: { providerId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await this.providerModel.findByIdAndUpdate(providerId, {
      ratingAverage: stats.length ? Math.round(stats[0].avg * 10) / 10 : 0,
      reviewCount: stats.length ? stats[0].count : 0,
    }).exec();
    return { deleted: true };
  }

  /* ------------------------------------------------------------------ Jobs */

  async getJobs(skip: number, limit: number, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      this.jobModel
        .find(filter)
        .populate('customerId', 'name phoneNumber')
        .populate({ path: 'providerId', populate: { path: 'userId', select: 'name' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.jobModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  /* ------------------------------------------------------------ Categories */

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

  async deleteCategory(id: string) {
    const inUse = await this.providerModel.countDocuments({ serviceCategories: new Types.ObjectId(id) }).exec();
    if (inUse > 0) {
      throw new BadRequestException(`Cannot delete: ${inUse} provider(s) use this category.`);
    }
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Category not found');
    return { deleted: true };
  }

  /* ------------------------------------------------------------------ Stats */

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

  /* ------------------------------------------------------------------ Plans */

  async createPlan(dto: CreatePlanDto) {
    return this.planModel.create(dto);
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const updated = await this.planModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Plan not found');
    return updated;
  }

  async deletePlan(id: string) {
    const inUse = await this.subscriptionModel.countDocuments({
      planId: new Types.ObjectId(id),
      endDate: { $gte: new Date() },
    }).exec();
    if (inUse > 0) {
      throw new BadRequestException(`Cannot delete: ${inUse} active subscription(s) use this plan.`);
    }
    const deleted = await this.planModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Plan not found');
    return { deleted: true };
  }
}
