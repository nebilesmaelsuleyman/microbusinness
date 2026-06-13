import { Model } from 'mongoose';
import { FavoriteDocument } from './schemas/favorite.schema';
export declare class FavoritesService {
    private favoriteModel;
    constructor(favoriteModel: Model<FavoriteDocument>);
    add(customerId: string, providerId: string): Promise<FavoriteDocument>;
    remove(customerId: string, providerId: string): Promise<{
        deleted: boolean;
    }>;
    list(customerId: string): Promise<FavoriteDocument[]>;
}
