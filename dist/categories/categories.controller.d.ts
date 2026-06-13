import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<import("./schemas/service-category.schema").ServiceCategoryDocument[]>;
    findOne(id: string): Promise<import("./schemas/service-category.schema").ServiceCategoryDocument>;
}
