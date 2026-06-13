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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const otp_session_schema_1 = require("./schemas/otp-session.schema");
const users_service_1 = require("../users/users.service");
const enums_1 = require("../common/enums");
const OTP_EXPIRY_MINUTES = 5;
let AuthService = class AuthService {
    constructor(otpModel, usersService, jwtService, config) {
        this.otpModel = otpModel;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
    }
    async sendOtp(dto) {
        const otp = process.env.NODE_ENV === 'test'
            ? '1234'
            : String(Math.floor(1000 + Math.random() * 9000));
        const expiryMin = this.config.get('OTP_EXPIRY_MINUTES') || OTP_EXPIRY_MINUTES;
        const expiresAt = new Date(Date.now() + expiryMin * 60 * 1000);
        await this.otpModel.deleteMany({ phoneNumber: dto.phoneNumber }).exec();
        await this.otpModel.create({ phoneNumber: dto.phoneNumber, otp, expiresAt });
        if (process.env.NODE_ENV !== 'production') {
            console.log('[DEV] OTP for', dto.phoneNumber, ':', otp);
        }
        return { message: 'OTP sent successfully' };
    }
    async verifyOtp(dto) {
        const session = await this.otpModel
            .findOne({ phoneNumber: dto.phoneNumber, verified: false })
            .sort({ createdAt: -1 })
            .exec();
        if (!session) {
            throw new common_1.BadRequestException('No OTP session found. Please request a new OTP.');
        }
        if (new Date() > session.expiresAt) {
            throw new common_1.BadRequestException('OTP expired. Please request a new OTP.');
        }
        if (session.otp !== dto.otp) {
            throw new common_1.UnauthorizedException('Invalid OTP.');
        }
        await this.otpModel.updateOne({ _id: session._id }, { verified: true }).exec();
        let user = await this.usersService.findByPhone(dto.phoneNumber);
        const role = dto.role ? dto.role : enums_1.UserRole.CUSTOMER;
        if (!user) {
            user = await this.usersService.create({
                phoneNumber: dto.phoneNumber,
                name: dto.name || '',
                role,
            });
        }
        const payload = {
            sub: user._id.toString(),
            phoneNumber: user.phoneNumber,
            role: user.role,
        };
        const access_token = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_SECRET') || 'default-secret',
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '7d',
        });
        return {
            access_token,
            user: {
                id: user._id,
                phoneNumber: user.phoneNumber,
                name: user.name,
                role: user.role,
                profilePhoto: user.profilePhoto,
                location: user.location,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(otp_session_schema_1.OtpSession.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map