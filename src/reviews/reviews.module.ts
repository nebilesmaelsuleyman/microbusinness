import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ProviderProfile, ProviderProfileSchema } from '../providers/schemas/provider-profile.schema';
import { JobRequest, JobRequestSchema } from '../jobs/schemas/job-request.schema';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: ProviderProfile.name, schema: ProviderProfileSchema },
      { name: JobRequest.name, schema: JobRequestSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
