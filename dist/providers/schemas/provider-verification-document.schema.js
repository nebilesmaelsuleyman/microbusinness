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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderVerificationDocumentSchema = exports.ProviderVerificationDocument = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
let ProviderVerificationDocument = class ProviderVerificationDocument {
};
exports.ProviderVerificationDocument = ProviderVerificationDocument;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ProviderProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ProviderVerificationDocument.prototype, "providerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ProviderVerificationDocument.prototype, "documentType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ProviderVerificationDocument.prototype, "documentUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: Object.values(enums_1.VerificationStatus),
        default: enums_1.VerificationStatus.PENDING,
    }),
    __metadata("design:type", String)
], ProviderVerificationDocument.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], ProviderVerificationDocument.prototype, "uploadedAt", void 0);
exports.ProviderVerificationDocument = ProviderVerificationDocument = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ProviderVerificationDocument);
exports.ProviderVerificationDocumentSchema = mongoose_1.SchemaFactory.createForClass(ProviderVerificationDocument);
exports.ProviderVerificationDocumentSchema.index({ providerId: 1 });
//# sourceMappingURL=provider-verification-document.schema.js.map