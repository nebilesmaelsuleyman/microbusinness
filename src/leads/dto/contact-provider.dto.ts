import { IsMongoId } from 'class-validator';

export class ContactProviderDto {
  @IsMongoId()
  providerId: string;
}
