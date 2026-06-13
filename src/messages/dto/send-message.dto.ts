import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  @IsOptional()
  conversationId?: string;

  @IsMongoId()
  @IsOptional()
  recipientId?: string;

  @IsMongoId()
  @IsOptional()
  jobId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
