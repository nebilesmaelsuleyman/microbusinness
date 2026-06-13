"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidersController = void 0;
const common_1 = require("@nestjs/common");
const providers_service_1 = require("./providers.service");
const create_provider_profile_dto_1 = require("./dto/create-provider-profile.dto");
const update_provider_profile_dto_1 = require("./dto/update-provider-profile.dto");
const search_providers_dto_1 = require("./dto/search-providers.dto");
const upload_verification_document_dto_1 = require("./dto/upload-verification-document.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const enums_1 = require("../common/enums");
const public_decorator_1 = require("../common/decorators/public.decorator");
let ProvidersController = class ProvidersController {
    constructor(providersService) {
        this.providersService = providersService;
    }
    search(query) {
        return this.providersService.search(query);
    }
    createProfile(userId, dto) {
        return this.providersService.create(userId, dto);
    }
    getMyProfile(userId) {
        return this.providersService.findByUserId(userId);
    }
    getProfile(userId, payload) {
        const reqUserId = payload?.sub ?? '';
        const reqRole = payload?.role ?? '';
        return this.providersService.getProfile(userId, reqUserId, reqRole);
    }
    updateProfile(userId, dto) {
        return this.providersService.updateProfile(userId, dto);
    }
    uploadVerificationDocument(userId, dto) {
        return this.providersService.uploadVerificationDocument(userId, dto);
    }
    getMyVerificationDocuments(userId) {
        return this.providersService.getMyVerificationDocuments(userId);
    }
};
exports.ProvidersController = ProvidersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_providers_dto_1.SearchProvidersDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "search", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SERVICE_PROVIDER),
    (0, common_1.Post)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_provider_profile_dto_1.CreateProviderProfileDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "createProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "getMyProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':userId/profile'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SERVICE_PROVIDER),
    (0, common_1.Patch)('profile'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_provider_profile_dto_1.UpdateProviderProfileDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SERVICE_PROVIDER),
    (0, common_1.Post)('verification-documents'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upload_verification_document_dto_1.UploadVerificationDocumentDto]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "uploadVerificationDocument", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(enums_1.UserRole.SERVICE_PROVIDER),
    (0, common_1.Get)('verification-documents/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProvidersController.prototype, "getMyVerificationDocuments", null);
exports.ProvidersController = ProvidersController = __decorate([
    (0, common_1.Controller)('providers'),
    __metadata("design:paramtypes", [providers_service_1.ProvidersService])
], ProvidersController);
//# sourceMappingURL=providers.controller.js.map