import { Model, Types } from 'mongoose';
import { SubscriptionPlan, SubscriptionPlanDocument } from './schemas/subscription-plan.schema';
import { ProviderSubscriptionDocument } from './schemas/provider-subscription.schema';
import { ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
export declare class SubscriptionsService {
    private planModel;
    private subModel;
    private providerModel;
    constructor(planModel: Model<SubscriptionPlanDocument>, subModel: Model<ProviderSubscriptionDocument>, providerModel: Model<ProviderProfileDocument>);
    createPlan(dto: CreatePlanDto): Promise<import("mongoose").Document<unknown, {}, SubscriptionPlanDocument, {}, {}> & SubscriptionPlan & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    findAllPlans(): Promise<(import("mongoose").FlattenMaps<SubscriptionPlanDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    subscribe(userId: string, planId: string): Promise<ProviderSubscriptionDocument>;
    getActiveSubscription(userId: string): Promise<(import("mongoose").FlattenMaps<ProviderSubscriptionDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    incrementLeadUsed(providerId: string): Promise<boolean>;
}
