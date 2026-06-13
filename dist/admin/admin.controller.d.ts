import { AdminService } from './admin.service';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../categories/dto/update-category.dto';
import { CreatePlanDto } from '../subscriptions/dto/create-plan.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAllUsers(skip?: string, limit?: string): Promise<(import("mongoose").FlattenMaps<import("../users/schemas/user.schema").UserDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getAllProviders(skip?: string, limit?: string): Promise<(import("mongoose").FlattenMaps<import("../providers/schemas/provider-profile.schema").ProviderProfileDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    setProviderVerification(providerId: string, status: 'approved' | 'rejected'): Promise<import("mongoose").Document<unknown, {}, import("../providers/schemas/provider-profile.schema").ProviderProfileDocument, {}, {}> & import("../providers/schemas/provider-profile.schema").ProviderProfile & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getPendingVerificationDocuments(): Promise<(import("mongoose").FlattenMaps<import("../providers/schemas/provider-verification-document.schema").ProviderVerificationDocumentDoc> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    setDocumentStatus(docId: string, status: 'approved' | 'rejected'): Promise<import("mongoose").Document<unknown, {}, import("../providers/schemas/provider-verification-document.schema").ProviderVerificationDocumentDoc, {}, {}> & import("../providers/schemas/provider-verification-document.schema").ProviderVerificationDocument & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getCategories(): Promise<(import("mongoose").FlattenMaps<import("../categories/schemas/service-category.schema").ServiceCategoryDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    createCategory(dto: CreateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("../categories/schemas/service-category.schema").ServiceCategoryDocument, {}, {}> & import("../categories/schemas/service-category.schema").ServiceCategory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<import("mongoose").Document<unknown, {}, import("../categories/schemas/service-category.schema").ServiceCategoryDocument, {}, {}> & import("../categories/schemas/service-category.schema").ServiceCategory & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    getJobStats(): Promise<any>;
    getRevenueMetrics(): Promise<{
        totalSubscriptions: number;
        totalRevenue: number;
        activeSubscriptions: number;
    }>;
    createPlan(dto: CreatePlanDto): Promise<import("mongoose").Document<unknown, {}, import("../subscriptions/schemas/subscription-plan.schema").SubscriptionPlanDocument, {}, {}> & import("../subscriptions/schemas/subscription-plan.schema").SubscriptionPlan & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
}
