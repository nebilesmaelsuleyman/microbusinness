import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { JobRequest, JobRequestDocument } from '../jobs/schemas/job-request.schema';
import { JobStatus, PaymentStatus } from '../common/enums';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
    @InjectModel(JobRequest.name) private jobModel: Model<JobRequestDocument>,
  ) {}

  async create(customerId: string, providerId: string, dto: CreateReviewDto) {
    const job = await this.jobModel.findOne({
      _id: new Types.ObjectId(dto.jobId),
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
    }).exec();

    if (!job) {
      throw new ForbiddenException('You can only review a job you created with this provider');
    }
    if (job.status !== JobStatus.COMPLETED || job.paymentStatus !== PaymentStatus.PAID) {
      throw new ForbiddenException('You can only review a provider after the job is completed and payment is confirmed');
    }

    const existing = await this.reviewModel.findOne({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
    }).exec();
    if (existing) throw new ForbiddenException('You have already reviewed this provider');

    const review = new this.reviewModel({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
      jobId: new Types.ObjectId(dto.jobId),
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
