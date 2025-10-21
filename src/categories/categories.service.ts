import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceCategory, ServiceCategoryDocument } from './schemas/service-category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(ServiceCategory.name)
    private categoryModel: Model<ServiceCategoryDocument>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<ServiceCategoryDocument> {
    const created = new this.categoryModel(dto);
    return created.save();
  }

  async findAll(): Promise<ServiceCategoryDocument[]> {
    return this.categoryModel.find().lean().exec() as unknown as Promise<ServiceCategoryDocument[]>;
  }

  async findById(id: string): Promise<ServiceCategoryDocument> {
    const cat = await this.categoryModel.findById(id).exec();
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<ServiceCategoryDocument> {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }
}
