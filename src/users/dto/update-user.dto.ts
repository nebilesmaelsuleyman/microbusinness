import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @IsObject()
  @IsOptional()
  location?: {
    city?: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
  };
}
