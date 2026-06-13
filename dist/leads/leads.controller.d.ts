import { LeadsService } from './leads.service';
import { ContactProviderDto } from './dto/contact-provider.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    contactProvider(customerId: string, dto: ContactProviderDto): Promise<{
        phoneNumber: string;
        lead: import("./schemas/lead.schema").LeadDocument;
    }>;
    myLeads(userId: string): Promise<import("./schemas/lead.schema").LeadDocument[]>;
}
