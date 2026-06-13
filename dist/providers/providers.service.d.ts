import { Model } from 'mongoose';
import { ProviderProfileDocument } from './schemas/provider-profile.schema';
import { ProviderVerificationDocumentDoc } from './schemas/provider-verification-document.schema';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { SearchProvidersDto } from './dto/search-providers.dto';
export declare class ProvidersService {
    private providerModel;
    private verificationDocModel;
    constructor(providerModel: Model<ProviderProfileDocument>, verificationDocModel: Model<ProviderVerificationDocumentDoc>);
    create(userId: string, dto: CreateProviderProfileDto): Promise<ProviderProfileDocument>;
    findByUserId(userId: string): Promise<ProviderProfileDocument | null>;
    getProfile(userId: string, requestUserId: string, requestRole: string): Promise<ProviderProfileDocument>;
    updateProfile(userId: string, dto: UpdateProviderProfileDto): Promise<ProviderProfileDocument>;
    search(dto: SearchProvidersDto): Promise<ProviderProfileDocument[]>;
    addVerificationDocument(providerId: string, documentType: string, documentUrl: string): Promise<ProviderVerificationDocumentDoc>;
    getVerificationDocuments(providerId: string): Promise<ProviderVerificationDocumentDoc[]>;
    uploadVerificationDocument(userId: string, dto: {
        documentType: string;
        documentUrl: string;
    }): Promise<ProviderVerificationDocumentDoc>;
    getMyVerificationDocuments(userId: string): Promise<ProviderVerificationDocumentDoc[]>;
}
