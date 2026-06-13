import { FavoritesService } from './favorites.service';
import { FavoriteProviderDto } from './dto/favorite-provider.dto';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    add(customerId: string, dto: FavoriteProviderDto): Promise<import("./schemas/favorite.schema").FavoriteDocument>;
    remove(customerId: string, providerId: string): Promise<{
        deleted: boolean;
    }>;
    list(customerId: string): Promise<import("./schemas/favorite.schema").FavoriteDocument[]>;
}
