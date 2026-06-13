import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { OtpSessionDocument } from './schemas/otp-session.schema';
import { UsersService } from '../users/users.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthService {
    private otpModel;
    private usersService;
    private jwtService;
    private config;
    constructor(otpModel: Model<OtpSessionDocument>, usersService: UsersService, jwtService: JwtService, config: ConfigService);
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        access_token: string;
        user: object;
    }>;
}
