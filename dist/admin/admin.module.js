"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const user_schema_1 = require("../users/schemas/user.schema");
const provider_profile_schema_1 = require("../providers/schemas/provider-profile.schema");
const provider_verification_document_schema_1 = require("../providers/schemas/provider-verification-document.schema");
const service_category_schema_1 = require("../categories/schemas/service-category.schema");
const job_request_schema_1 = require("../jobs/schemas/job-request.schema");
const provider_subscription_schema_1 = require("../subscriptions/schemas/provider-subscription.schema");
const subscription_plan_schema_1 = require("../subscriptions/schemas/subscription-plan.schema");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: provider_profile_schema_1.ProviderProfile.name, schema: provider_profile_schema_1.ProviderProfileSchema },
                { name: provider_verification_document_schema_1.ProviderVerificationDocument.name, schema: provider_verification_document_schema_1.ProviderVerificationDocumentSchema },
                { name: service_category_schema_1.ServiceCategory.name, schema: service_category_schema_1.ServiceCategorySchema },
                { name: job_request_schema_1.JobRequest.name, schema: job_request_schema_1.JobRequestSchema },
                { name: provider_subscription_schema_1.ProviderSubscription.name, schema: provider_subscription_schema_1.ProviderSubscriptionSchema },
                { name: subscription_plan_schema_1.SubscriptionPlan.name, schema: subscription_plan_schema_1.SubscriptionPlanSchema },
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map