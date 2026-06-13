import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { LeadsService } from '../leads/leads.service';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
    private leadsService: LeadsService,
  ) {}

  async create(customerId: string, providerId: string, dto: CreateReviewDto) {
    const hasLead = await this.leadsService.hasLead(customerId, providerId);
    if (!hasLead) throw new ForbiddenException('You can only review providers you have contacted');
    const existing = await this.reviewModel.findOne({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
    }).exec();
    if (existing) throw new ForbiddenException('You have already reviewed this provider');
    const review = new this.reviewModel({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
      rating: dto.rating,
      comment: dto.comment ?? '',
    });
    await review.save();
    await this.updateProviderRating(providerId);
    return review;
  }

  private async updateProviderRating(providerId: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { providerId: new Types.ObjectId(providerId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length) {
      await this.providerModel.findByIdAndUpdate(providerId, {
        ratingAverage: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      }).exec();
    }
  }

  async findByProvider(providerId: string) {
    return this.reviewModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}
