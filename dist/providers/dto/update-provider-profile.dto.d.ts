import { PricingModel } from '../../common/enums';
export declare class UpdateProviderProfileDto {
    serviceCategories?: string[];
    serviceDescription?: string;
    yearsOfExperience?: number;
    serviceRadiusKm?: number;
    pricingModel?: PricingModel;
    availabilitySchedule?: Record<string, unknown>;
    latitude?: number;
    longitude?: number;
}
