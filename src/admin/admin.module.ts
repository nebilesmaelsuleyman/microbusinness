import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ProviderProfile, ProviderProfileSchema } from '../providers/schemas/provider-profile.schema';
import {
  ProviderVerificationDocument,
  ProviderVerificationDocumentSchema,
} from '../providers/schemas/provider-verification-document.schema';
import {
  ServiceCategory,
  ServiceCategorySchema,
} from '../categories/schemas/service-category.schema';
import { JobRequest, JobRequestSchema } from '../jobs/schemas/job-request.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import {
  ProviderSubscription,
  ProviderSubscriptionSchema,
} from '../subscriptions/schemas/provider-subscription.schema';
import {
  SubscriptionPlan,
  SubscriptionPlanSchema,
} from '../subscriptions/schemas/subscription-plan.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ProviderProfile.name, schema: ProviderProfileSchema },
      { name: ProviderVerificationDocument.name, schema: ProviderVerificationDocumentSchema },
      { name: ServiceCategory.name, schema: ServiceCategorySchema },
      { name: JobRequest.name, schema: JobRequestSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: ProviderSubscription.name, schema: ProviderSubscriptionSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
