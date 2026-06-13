import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { LeadsService } from '../leads/leads.service';
import { ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
export declare class ReviewsService {
    private reviewModel;
    private providerModel;
    private leadsService;
    constructor(reviewModel: Model<ReviewDocument>, providerModel: Model<ProviderProfileDocument>, leadsService: LeadsService);
    create(customerId: string, providerId: string, dto: CreateReviewDto): Promise<import("mongoose").Document<unknown, {}, ReviewDocument, {}, {}> & Review & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    private updateProviderRating;
    findByProvider(providerId: string): Promise<(import("mongoose").FlattenMaps<ReviewDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
