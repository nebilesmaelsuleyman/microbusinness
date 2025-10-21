import { IsString, IsNotEmpty, IsMongoId, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsMongoId({ message: 'A valid recipient id is required' })
  recipientId: string;

  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @MaxLength(4000)
  body: string;
}
