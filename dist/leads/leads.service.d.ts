import { Model } from 'mongoose';
import { LeadDocument } from './schemas/lead.schema';
import { ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { UserDocument } from '../users/schemas/user.schema';
export declare class LeadsService {
    private leadModel;
    private providerModel;
    private userModel;
    constructor(leadModel: Model<LeadDocument>, providerModel: Model<ProviderProfileDocument>, userModel: Model<UserDocument>);
    recordLead(customerId: string, providerId: string): Promise<{
        phoneNumber: string;
        lead: LeadDocument;
    }>;
    getLeadsForProvider(providerId: string, userId: string): Promise<LeadDocument[]>;
    hasLead(customerId: string, providerId: string): Promise<boolean>;
    getLeadsForProviderByUserId(userId: string): Promise<LeadDocument[]>;
}
