import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { OtpSession, OtpSessionSchema } from './schemas/otp-session.schema';
import { Session, SessionSchema } from './schemas/session.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: OtpSession.name, schema: OtpSessionSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'default-secret',
        // Default to a short-lived access token; override with JWT_EXPIRES_IN env var.
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '1h' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
