import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { OtpSession, OtpSessionDocument } from './schemas/otp-session.schema';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/enums';

const OTP_EXPIRY_MINUTES = 5;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(OtpSession.name) private otpModel: Model<OtpSessionDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ message: string; isNewUser: boolean; devOtp?: string }> {
    const otp = process.env.NODE_ENV === 'production'
      ? String(Math.floor(1000 + Math.random() * 9000))
      : '1234';
    const expiryMin = this.config.get('OTP_EXPIRY_MINUTES') || OTP_EXPIRY_MINUTES;
    const expiresAt = new Date(Date.now() + expiryMin * 60 * 1000);

    await this.otpModel.deleteMany({ phoneNumber: dto.phoneNumber }).exec();
    await this.otpModel.create({ phoneNumber: dto.phoneNumber, otp, expiresAt });

    // Tell the client whether this phone already has an account, so the login
    // screen can show a clean "sign in" for returning users and only ask new
    // numbers for a name + role.
    const existing = await this.usersService.findByPhone(dto.phoneNumber);
    const isNewUser = !existing;

    // Outside production we surface a deterministic OTP so dev flows don't depend on
    // a real SMS gateway: it's logged to the console AND returned to the client so
    // the login screen can display/prefill it. NEVER returned in production.
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      console.log('[DEV] OTP for', dto.phoneNumber, ':', otp);
    }
    return isProd
      ? { message: 'OTP sent successfully', isNewUser }
      : { message: 'OTP sent successfully', isNewUser, devOtp: otp };
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
    if (user && user.isActive === false) {
      throw new ForbiddenException('This account has been suspended. Please contact support.');
    }
    const role = dto.role ? (dto.role as UserRole) : UserRole.CUSTOMER;

    if (!user) {
      user = await this.usersService.create({
        phoneNumber: dto.phoneNumber,
        name: dto.name || '',
        role,
      });
    }

    return this.issueSession(user);
  }

  /** Email + password registration. Phone is still captured for the contact/leads flow. */
  async register(dto: RegisterDto): Promise<{ access_token: string; user: object }> {
    const email = dto.email.toLowerCase().trim();

    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('An account with this email already exists. Try logging in.');
    }
    if (await this.usersService.findByPhone(dto.phoneNumber)) {
      throw new ConflictException('An account with this phone number already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      phoneNumber: dto.phoneNumber,
      email,
      passwordHash,
      name: dto.name || '',
      role: dto.role as UserRole,
    });

    return this.issueSession(user);
  }

  /** Email + password login. */
  async login(dto: LoginDto): Promise<{ access_token: string; user: object }> {
    const user = await this.usersService.findByEmail(dto.email, true);
    // Uniform error so we don't reveal whether the email exists or only the password was wrong.
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (user.isActive === false) {
      throw new ForbiddenException('This account has been suspended. Please contact support.');
    }
    return this.issueSession(user);
  }

  /** Signs a JWT for the user and returns the token + a safe, serialized user (never the hash). */
  private issueSession(user: UserDocument): { access_token: string; user: object } {
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
        email: user.email,
        name: user.name,
        role: user.role,
        profilePhoto: user.profilePhoto,
        location: user.location,
      },
    };
  }
}
