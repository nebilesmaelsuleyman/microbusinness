import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OtpSession, OtpSessionDocument } from './schemas/otp-session.schema';
import { UsersService } from '../users/users.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserRole } from '../common/enums';

const OTP_EXPIRY_MINUTES = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(OtpSession.name) private otpModel: Model<OtpSessionDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const otp =
      process.env.NODE_ENV === 'test'
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

  async verifyOtp(dto: VerifyOtpDto): Promise<{ access_token: string; user: object }> {
    const session = await this.otpModel
      .findOne({ phoneNumber: dto.phoneNumber, verified: false })
      .sort({ createdAt: -1 })
      .exec();

    if (!session) {
      throw new BadRequestException('No OTP session found. Please request a new OTP.');
    }
    if (new Date() > session.expiresAt) {
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }
    if (session.otp !== dto.otp) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    await this.otpModel.updateOne({ _id: session._id }, { verified: true }).exec();

    let user = await this.usersService.findByPhone(dto.phoneNumber);
    const role = dto.role ? (dto.role as UserRole) : UserRole.CUSTOMER;

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
}
