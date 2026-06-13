import { SubscriptionsService } from './subscriptions.service';
import { SubscribeDto } from './dto/subscribe.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    listPlans(): Promise<(import("mongoose").FlattenMaps<import("./schemas/subscription-plan.schema").SubscriptionPlanDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    subscribe(userId: string, dto: SubscribeDto): Promise<import("./schemas/provider-subscription.schema").ProviderSubscriptionDocument>;
    mySubscription(userId: string): Promise<(import("mongoose").FlattenMaps<import("./schemas/provider-subscription.schema").ProviderSubscriptionDocument> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
}
