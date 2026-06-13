import { IsString, Matches, Length, IsOptional, IsIn } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format (E.164)' })
  phoneNumber: string;

  @IsString()
  @Length(4, 8, { message: 'OTP must be 4-8 digits' })
  otp: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['customer', 'provider', 'admin'])
  role?: 'customer' | 'provider' | 'admin';
}
