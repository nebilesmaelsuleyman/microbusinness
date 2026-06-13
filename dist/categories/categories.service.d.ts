import { Model } from 'mongoose';
import { ServiceCategoryDocument } from './schemas/service-category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private categoryModel;
    constructor(categoryModel: Model<ServiceCategoryDocument>);
    create(dto: CreateCategoryDto): Promise<ServiceCategoryDocument>;
    findAll(): Promise<ServiceCategoryDocument[]>;
    findById(id: string): Promise<ServiceCategoryDocument>;
    update(id: string, dto: UpdateCategoryDto): Promise<ServiceCategoryDocument>;
}
