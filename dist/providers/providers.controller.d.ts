import { ProvidersService } from './providers.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class ProvidersController {
    private readonly providersService;
    constructor(providersService: ProvidersService);
    search(query: SearchProvidersDto): Promise<import("./schemas/provider-profile.schema").ProviderProfileDocument[]>;
    createProfile(userId: string, dto: CreateProviderProfileDto): Promise<import("./schemas/provider-profile.schema").ProviderProfileDocument>;
    getMyProfile(userId: string): Promise<import("./schemas/provider-profile.schema").ProviderProfileDocument | null>;
    getProfile(userId: string, payload: JwtPayload | undefined): Promise<import("./schemas/provider-profile.schema").ProviderProfileDocument>;
    updateProfile(userId: string, dto: UpdateProviderProfileDto): Promise<import("./schemas/provider-profile.schema").ProviderProfileDocument>;
    uploadVerificationDocument(userId: string, dto: UploadVerificationDocumentDto): Promise<import("./schemas/provider-verification-document.schema").ProviderVerificationDocumentDoc>;
    getMyVerificationDocuments(userId: string): Promise<import("./schemas/provider-verification-document.schema").ProviderVerificationDocumentDoc[]>;
}
