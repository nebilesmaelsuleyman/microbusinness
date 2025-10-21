import { IsString, IsEnum, IsOptional, Matches } from 'class-validator';
import { UserRole } from '../../common/enums';

export class CreateUserDto {
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format (E.164)' })
  phoneNumber: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UserRole)
  role: UserRole;
}
