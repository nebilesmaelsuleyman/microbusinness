import { IsMongoId } from 'class-validator';

export class FavoriteProviderDto {
  @IsMongoId()
  providerId: string;
}
