import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import {
  ProviderProfile,
  ProviderProfileSchema,
} from './schemas/provider-profile.schema';
import {
  ProviderVerificationDocument,
  ProviderVerificationDocumentSchema,
} from './schemas/provider-verification-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderProfile.name, schema: ProviderProfileSchema },
      {
        name: ProviderVerificationDocument.name,
        schema: ProviderVerificationDocumentSchema,
      },
    ]),
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
