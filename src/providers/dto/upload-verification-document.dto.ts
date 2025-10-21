import { IsString, IsUrl } from 'class-validator';

export class UploadVerificationDocumentDto {
  @IsString()
  documentType: string;

  @IsUrl()
  documentUrl: string;
}
