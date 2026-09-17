import { Controller, Post, Body, Res, Req, UnauthorizedException, Get, UseGuards, Delete, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Tight limits prevent SMS-bombing and OTP brute-force: 5 sends/min, 10 verifies/min per IP.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.verifyOtp(dto, req);
    // Set refresh token cookie (httpOnly). Access token returned in body.
    if (session.refresh_token) {
      const secure = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', session.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: (parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10) || 30) * 24 * 60 * 60 * 1000,
      });
    }
    return { access_token: session.access_token, user: session.user };
  }

  // Email + password signup.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.register(dto, req);
    if (session.refresh_token) {
      const secure = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', session.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: (parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10) || 30) * 24 * 60 * 60 * 1000,
      });
    }
    return { access_token: session.access_token, user: session.user };
  }

  // Email + password login; rate-limited to slow credential stuffing.
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const session = await this.authService.login(dto, req);
    if (session.refresh_token) {
      const secure = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', session.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: (parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10) || 30) * 24 * 60 * 60 * 1000,
      });
    }
    return { access_token: session.access_token, user: session.user };
  }

  // Exchange an httpOnly refresh cookie for a new access token (rotates refresh token).
  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Parse cookie header to find refresh_token (avoid requiring cookie-parser middleware).
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').map((c) => c.trim()).filter(Boolean);
    let refreshToken: string | undefined;
    for (const c of cookies) {
      const [k, v] = c.split('=');
      if (k === 'refresh_token') { refreshToken = decodeURIComponent(v || ''); break; }
    }
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const session = await this.authService.refreshSession(refreshToken);
    if (session.refresh_token) {
      const secure = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', session.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: (parseInt(process.env.REFRESH_EXPIRES_DAYS || '30', 10) || 30) * 24 * 60 * 60 * 1000,
      });
    }
    return { access_token: session.access_token, user: session.user };
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').map((c) => c.trim()).filter(Boolean);
    let refreshToken: string | undefined;
    for (const c of cookies) {
      const [k, v] = c.split('=');
      if (k === 'refresh_token') { refreshToken = decodeURIComponent(v || ''); break; }
    }
    if (refreshToken) {
      try {
        const decoded: any = this.authService['jwtService'].verify(refreshToken, { secret: process.env.JWT_SECRET || 'default-secret' });
        if (decoded && decoded.sub) {
          await this.authService.revokeRefreshToken(decoded.sub as string);
        }
      } catch (e) {
        // ignore invalid token
      }
    }
    // Clear cookie
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'ok' };
  }

  // Password reset: request
  @Public()
  @Post('password/request')
  async requestPasswordReset(@Body() body: { email?: string }) {
    if (!body?.email) throw new UnauthorizedException('email required');
    return this.authService.requestPasswordReset(body.email);
  }

  // Password reset: perform
  @Public()
  @Post('password/reset')
  async resetPassword(@Body() body: { token?: string; password?: string }) {
    if (!body?.token || !body?.password) throw new UnauthorizedException('token and password required');
    return this.authService.resetPassword(body.token, body.password);
  }

  // Email verification request (by email)
  @Public()
  @Post('email/request')
  async requestEmailVerification(@Body() body: { email?: string }) {
    if (!body?.email) throw new UnauthorizedException('email required');
    return this.authService.requestEmailVerification({ email: body.email });
  }

  // Verify email token
  @Public()
  @Post('email/verify')
  async verifyEmail(@Body() body: { token?: string }) {
    if (!body?.token) throw new UnauthorizedException('token required');
    return this.authService.verifyEmail(body.token);
  }

  // List sessions for current user
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async sessions(@CurrentUser('sub') userId: string) {
    return this.authService.listSessions(userId);
  }

  // Revoke a session
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  async revoke(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.authService.revokeSession(userId, id);
  }

  // TOTP setup: generate secret + return otpauth URL. Secret persisted but disabled until verification.
  @UseGuards(JwtAuthGuard)
  @Post('totp/setup')
  async totpSetup(@CurrentUser('sub') userId: string) {
    return this.authService.prepareTotpSetup(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('totp/verify')
  async totpVerify(@CurrentUser('sub') userId: string, @Body() body: { token?: string }) {
    if (!body?.token) throw new BadRequestException('token required');
    const ok = await this.authService.verifyAndEnableTotp(userId, body.token);
    return { verified: ok };
  }

  @UseGuards(JwtAuthGuard)
  @Post('totp/disable')
  async totpDisable(@CurrentUser('sub') userId: string) {
    await this.authService.disableTotp(userId);
    return { ok: true };
  }
}
