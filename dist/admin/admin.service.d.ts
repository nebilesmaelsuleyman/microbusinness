import { Model, Types } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { ProviderVerificationDocument, ProviderVerificationDocumentDoc } from '../providers/schemas/provider-verification-document.schema';
import { ServiceCategory, ServiceCategoryDocument } from '../categories/schemas/service-category.schema';
import { JobRequestDocument } from '../jobs/schemas/job-request.schema';
import { ProviderSubscriptionDocument } from '../subscriptions/schemas/provider-subscription.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../subscriptions/schemas/subscription-plan.schema';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';
import { CreatePlanDto } from '../subscriptions/dto/create-plan.dto';
export declare class AdminService {
    private userModel;
    private providerModel;
    private verificationDocModel;
    private categoryModel;
    private jobModel;
    private subscriptionModel;
    private planModel;
    constructor(userModel: Model<UserDocument>, providerModel: Model<ProviderProfileDocument>, verificationDocModel: Model<ProviderVerificationDocumentDoc>, categoryModel: Model<ServiceCategoryDocument>, jobModel: Model<JobRequestDocument>, subscriptionModel: Model<ProviderSubscriptionDocument>, planModel: Model<SubscriptionPlanDocument>);
    getAllUsers(skip: number, limit: number): Promise<(import("mongoose").FlattenMaps<UserDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getAllProviders(skip: number, limit: number): Promise<(import("mongoose").FlattenMaps<ProviderProfileDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    setProviderVerification(providerId: string, status: 'approved' | 'rejected'): Promise<import("mongoose").Document<unknown, {}, ProviderProfileDocument, {}, {}> & ProviderProfile & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getPendingVerificationDocuments(): Promise<(import("mongoose").FlattenMaps<ProviderVerificationDocumentDoc> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    setDocumentStatus(docId: string, status: 'approved' | 'rejected'): Promise<import("mongoose").Document<unknown, {}, ProviderVerificationDocumentDoc, {}, {}> & ProviderVerificationDocument & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getCategories(): Promise<(import("mongoose").FlattenMaps<ServiceCategoryDocument> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createCategory(dto: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, ServiceCategoryDocument, {}, {}> & ServiceCategory & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<import("mongoose").Document<unknown, {}, ServiceCategoryDocument, {}, {}> & ServiceCategory & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getJobStats(): Promise<any>;
    getRevenueMetrics(): Promise<{
        totalSubscriptions: number;
        totalRevenue: number;
        activeSubscriptions: number;
    }>;
    createPlan(dto: CreatePlanDto): Promise<import("mongoose").Document<unknown, {}, SubscriptionPlanDocument, {}, {}> & SubscriptionPlan & import("mongoose").Document<Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
