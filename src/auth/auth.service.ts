import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as nodemailer from 'nodemailer';
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
    @InjectModel('Session') private sessionModel: Model<any>,
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

  async verifyOtp(dto: VerifyOtpDto, req?: any): Promise<{ access_token: string; refresh_token?: string; user: object }> {
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

    return await this.issueSession(user, req);
  }

  /** Email + password registration. Phone is still captured for the contact/leads flow. */
  async register(dto: RegisterDto, req?: any): Promise<{ access_token: string; refresh_token?: string; user: object }> {
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

    return await this.issueSession(user, req);
  }

  /** Email + password login. */
  async login(dto: LoginDto, req?: any): Promise<{ access_token: string; refresh_token?: string; user: object }> {
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
    return await this.issueSession(user, req);
  }

  /** Signs a JWT for the user and returns the token + a safe, serialized user (never the hash). */
  private async issueSession(user: UserDocument, req?: any): Promise<{ access_token: string; refresh_token: string; user: object }> {
    const payload = {
      sub: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET') || 'default-secret',
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '1h',
    });

    // Create a signed refresh token with a unique jwtid so we can rotate/verify it.
    const refreshJti = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET') || 'default-secret',
      expiresIn: this.config.get('REFRESH_EXPIRES_IN') || '30d',
      jwtid: refreshJti,
    });

    // Hash and persist the refresh token identifier in a per-device session document.
    const hash = await bcrypt.hash(refreshJti, BCRYPT_ROUNDS);
    const ua = req?.headers?.['user-agent'] || null;
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    const expiresAt = new Date(Date.now() + (parseInt(this.config.get('REFRESH_EXPIRES_DAYS') || '30', 10) || 30) * 24 * 60 * 60 * 1000);
    const deviceName = ua ? (ua.split(')')[0] + ')' ) : null;
    await this.sessionModel.create({ user: user._id, jtiHash: hash, userAgent: ua, ip, expiresAt, deviceName });

    return {
      access_token,
      refresh_token,
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

  private async sendEmail(to: string, subject: string, text: string, html?: string) {
    const smtpHost = this.config.get('SMTP_HOST');
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');
    const smtpSecure = this.config.get('SMTP_SECURE') === 'true';
    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({ host: smtpHost, auth: { user: smtpUser, pass: smtpPass }, secure: smtpSecure });
      await transporter.sendMail({ from: this.config.get('SMTP_FROM') || smtpUser, to, subject, text, html });
      return { sent: true };
    }
    return { sent: false };
  }

  async requestPasswordReset(email: string): Promise<{ sent: boolean; devToken?: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { sent: false };
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const hash = await bcrypt.hash(token, BCRYPT_ROUNDS);
    const expires = new Date(Date.now() + (parseInt(this.config.get('PASSWORD_RESET_EXPIRES_MIN') || '60', 10)) * 60 * 1000);
    await this.usersService.setPasswordReset(user._id.toString(), hash, expires);
    const resetUrl = `${this.config.get('FRONTEND_URL') || ''}/password-reset?token=${encodeURIComponent(token)}`;
    const sendRes = await this.sendEmail(user.email!, 'Reset your password', `Use this link to reset your password: ${resetUrl}`, `<p>Use this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`);
    if (sendRes.sent) return { sent: true };
    return { sent: false, devToken: token };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ ok: boolean }> {
    const users = await this.usersService.findAll(0, 1000);
    let target: any = null;
    for (const u of users) {
      if (!u.passwordResetHash) continue;
      if (u.passwordResetExpires && new Date() > new Date(u.passwordResetExpires)) continue;
      if (await bcrypt.compare(token, u.passwordResetHash)) { target = u; break; }
    }
    if (!target) throw new UnauthorizedException('Invalid or expired token');
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersService.setPassword(target._id.toString(), passwordHash);
    await this.usersService.setPasswordReset(target._id.toString(), null, null);
    await this.revokeRefreshToken(target._id.toString());
    return { ok: true };
  }

  async requestEmailVerification(emailOrUserId: { email?: string; userId?: string }): Promise<{ sent: boolean; devToken?: string }> {
    let user: any = null;
    if (emailOrUserId.userId) user = await this.usersService.findById(emailOrUserId.userId);
    else if (emailOrUserId.email) user = await this.usersService.findByEmail(emailOrUserId.email);
    if (!user || !user.email) return { sent: false };
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const hash = await bcrypt.hash(token, BCRYPT_ROUNDS);
    await this.usersService.setEmailVerification(user._id.toString(), hash);
    const verifyUrl = `${this.config.get('FRONTEND_URL') || ''}/verify-email?token=${encodeURIComponent(token)}`;
    const sendRes = await this.sendEmail(user.email, 'Verify your email', `Click to verify: ${verifyUrl}`, `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`);
    if (sendRes.sent) return { sent: true };
    return { sent: false, devToken: token };
  }

  async verifyEmail(token: string): Promise<{ ok: boolean }> {
    const users = await this.usersService.findAll(0, 1000);
    let target: any = null;
    for (const u of users) {
      if (!u.emailVerificationHash) continue;
      if (await bcrypt.compare(token, u.emailVerificationHash)) { target = u; break; }
    }
    if (!target) throw new UnauthorizedException('Invalid token');
    await this.usersService.markEmailVerified(target._id.toString());
    return { ok: true };
  }

  /** Verify an incoming refresh token, rotate it, and return new tokens. */
  async refreshSession(refreshToken: string): Promise<{ access_token: string; refresh_token: string; user: object }> {
    // Verify signature / expiry first.
    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshToken, { secret: this.config.get('JWT_SECRET') || 'default-secret' });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = decoded.sub as string;
    const jti = decoded.jti as string;
    if (!userId || !jti) throw new UnauthorizedException('Invalid refresh token payload');

    // Find a matching session for this user whose hashed jti matches and is not revoked.
    const sessions = await this.sessionModel.find({ user: userId, revoked: false }).select('+jtiHash').exec();
    if (!sessions || sessions.length === 0) throw new UnauthorizedException();
    let matched: any = null;
    for (const s of sessions) {
      // jtiHash stored with select:false so ensure it's present
      if (await bcrypt.compare(jti, s.jtiHash)) { matched = s; break; }
    }
    if (!matched) throw new UnauthorizedException();

    // revoke the old session and issue a new one
    await this.sessionModel.findByIdAndUpdate(matched._id, { revoked: true }).exec();
    const user = await this.usersService.findById(userId);
    const newSession = await this.issueSession(user);
    return newSession;
  }

  /** Clear stored refresh token for a user (logout). */
  async revokeRefreshToken(userId: string): Promise<void> {
    // Revoke all sessions for the user
    await this.sessionModel.updateMany({ user: userId }, { revoked: true }).exec();
  }

  async listSessions(userId: string) {
    return this.sessionModel.find({ user: userId }).select('-jtiHash').sort({ createdAt: -1 }).lean().exec();
  }

  async revokeSession(userId: string, sessionId: string) {
    const s = await this.sessionModel.findOne({ _id: sessionId, user: userId }).exec();
    if (!s) throw new UnauthorizedException();
    s.revoked = true;
    await s.save();
    return { ok: true };
  }

  // TOTP (optional 2FA) helpers
  async prepareTotpSetup(userId: string) {
    const secret = speakeasy.generateSecret({ length: 20, name: `Microbusiness (${userId})` });
    // Persist the secret but don't enable TOTP until verification succeeds.
    await this.usersService.setTotpSecret(userId, secret.base32, false);
    return { base32: secret.base32, otpauth_url: secret.otpauth_url };
  }

  async verifyAndEnableTotp(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    const secret = user.totpSecret;
    if (!secret) throw new BadRequestException('No TOTP secret configured');
    const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    if (ok) {
      await this.usersService.setTotpSecret(userId, secret, true);
    }
    return ok;
  }

  async disableTotp(userId: string) {
    await this.usersService.setTotpSecret(userId, null, false);
  }
}
