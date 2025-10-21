import { IsString, IsEmail, MinLength, Matches, IsIn, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'A valid email is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format (E.164)' })
  phoneNumber: string;

  // Self-service signup is limited to customer/provider; admins are created via seed/admin tools.
  @IsIn(['customer', 'provider'])
  role: 'customer' | 'provider';
}
