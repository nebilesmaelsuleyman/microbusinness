import { PricingModel } from '../../common/enums';
export declare class CreateProviderProfileDto {
    serviceCategories?: string[];
    serviceDescription?: string;
    yearsOfExperience?: number;
    serviceRadiusKm?: number;
    pricingModel?: PricingModel;
    availabilitySchedule?: Record<string, unknown>;
    latitude?: number;
    longitude?: number;
}
