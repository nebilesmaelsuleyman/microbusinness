import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobRequest, JobRequestDocument } from './schemas/job-request.schema';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { CreateJobRequestDto } from './dto/create-job-request.dto';
import { CompleteJobDto, QuoteJobDto } from './dto/complete-job.dto';
import { JobStatus, NotificationType, UserRole } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(JobRequest.name) private jobModel: Model<JobRequestDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(customerId: string, dto: CreateJobRequestDto): Promise<JobRequestDocument> {
    const job = new this.jobModel({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(dto.providerId),
      description: dto.description ?? '',
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
      status: JobStatus.REQUESTED,
    });
    await job.save();

    const profile = await this.providerModel.findById(dto.providerId).exec();
    if (profile) {
      await this.notificationsService.create(
        profile.userId.toString(),
        NotificationType.JOB_REQUEST,
        'New job request',
        dto.description?.slice(0, 100) || 'A customer requested your service',
        { jobId: job._id.toString() },
      );
    }

    return job;
  }

  async findById(id: string): Promise<JobRequestDocument> {
    const job = await this.jobModel.findById(id).populate('customerId providerId').exec();
    if (!job) throw new NotFoundException('Job request not found');
    return job;
  }

  async updateStatus(
    jobId: string,
    status: JobStatus,
    userId: string,
    role: string,
  ): Promise<JobRequestDocument> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException('Job request not found');
    if (role === UserRole.SERVICE_PROVIDER) {
      const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
      if (!profile || job.providerId.toString() !== profile._id.toString()) {
        throw new ForbiddenException('Not your job');
      }
      if (![JobStatus.ACCEPTED, JobStatus.REJECTED].includes(status)) {
        throw new ForbiddenException('Provider can only accept or reject');
      }
    } else if (role === UserRole.CUSTOMER) {
      if (job.customerId.toString() !== userId) throw new ForbiddenException('Not your job');
      if (status !== JobStatus.CANCELLED) {
        throw new ForbiddenException('Customer can only cancel');
      }
    }
    job.status = status;
    await job.save();

    const notifyUserId = role === UserRole.SERVICE_PROVIDER
      ? job.customerId.toString()
      : (await this.providerModel.findById(job.providerId).exec())?.userId?.toString();
    if (notifyUserId) {
      await this.notificationsService.create(
        notifyUserId,
        NotificationType.JOB_STATUS,
        `Job ${status}`,
        `Your job request is now ${status}`,
        { jobId: job._id.toString(), status },
      );
    }

    return job;
  }

  async setQuote(jobId: string, providerUserId: string, dto: QuoteJobDto): Promise<JobRequestDocument> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException('Job not found');
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(providerUserId) }).exec();
    if (!profile || job.providerId.toString() !== profile._id.toString()) {
      throw new ForbiddenException('Not your job');
    }
    job.quotedPrice = dto.quotedPrice;
    await job.save();

    await this.notificationsService.create(
      job.customerId.toString(),
      NotificationType.JOB_STATUS,
      'Quote received',
      `Provider quoted ${dto.quotedPrice.toFixed(2)} for your job`,
      { jobId: job._id.toString(), quotedPrice: dto.quotedPrice },
    );

    return job;
  }

  async complete(jobId: string, providerUserId: string, dto: CompleteJobDto): Promise<JobRequestDocument> {
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) throw new NotFoundException('Job not found');
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(providerUserId) }).exec();
    if (!profile || job.providerId.toString() !== profile._id.toString()) {
      throw new ForbiddenException('Not your job');
    }
    if (job.status !== JobStatus.ACCEPTED) {
      throw new ForbiddenException('Only accepted jobs can be completed');
    }
    job.status = JobStatus.COMPLETED;
    job.completedAt = new Date();
    if (dto.finalPrice !== undefined) job.finalPrice = dto.finalPrice;
    if (dto.completionNotes !== undefined) job.completionNotes = dto.completionNotes;
    await job.save();

    await this.notificationsService.create(
      job.customerId.toString(),
      NotificationType.JOB_STATUS,
      'Job completed',
      dto.completionNotes || 'Your job has been marked complete. Please leave a review!',
      { jobId: job._id.toString() },
    );

    return job;
  }

  async findByCustomer(customerId: string): Promise<JobRequestDocument[]> {
    return this.jobModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate('providerId')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as Promise<JobRequestDocument[]>;
  }

  async findByProvider(providerId: string): Promise<JobRequestDocument[]> {
    return this.jobModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .populate('customerId')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as Promise<JobRequestDocument[]>;
  }

  async findByProviderUserId(userId: string): Promise<JobRequestDocument[]> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!profile) return [];
    return this.findByProvider(profile._id.toString());
  }

  async getStats(): Promise<Record<string, number>> {
    const stats = await this.jobModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(stats.map((s) => [s._id, s.count]));
  }
}
