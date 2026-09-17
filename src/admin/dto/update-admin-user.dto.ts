import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
