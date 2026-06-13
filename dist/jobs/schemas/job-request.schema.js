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
exports.JobRequestSchema = exports.JobRequest = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const enums_1 = require("../../common/enums");
let JobRequest = class JobRequest {
};
exports.JobRequest = JobRequest;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], JobRequest.prototype, "customerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ProviderProfile', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], JobRequest.prototype, "providerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], JobRequest.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", Object)
], JobRequest.prototype, "scheduledDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: Object.values(enums_1.JobStatus), default: enums_1.JobStatus.REQUESTED }),
    __metadata("design:type", String)
], JobRequest.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], JobRequest.prototype, "createdAt", void 0);
exports.JobRequest = JobRequest = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], JobRequest);
exports.JobRequestSchema = mongoose_1.SchemaFactory.createForClass(JobRequest);
exports.JobRequestSchema.index({ customerId: 1 });
exports.JobRequestSchema.index({ providerId: 1 });
exports.JobRequestSchema.index({ status: 1 });
//# sourceMappingURL=job-request.schema.js.map