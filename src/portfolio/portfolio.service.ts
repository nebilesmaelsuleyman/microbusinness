import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PortfolioItem, PortfolioItemDocument } from './schemas/portfolio-item.schema';
import { ProviderProfile, ProviderProfileDocument } from '../providers/schemas/provider-profile.schema';
import { CreatePortfolioItemDto, UpdatePortfolioItemDto } from './dto/create-portfolio-item.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectModel(PortfolioItem.name) private itemModel: Model<PortfolioItemDocument>,
    @InjectModel(ProviderProfile.name) private providerModel: Model<ProviderProfileDocument>,
  ) {}

  private async getProviderProfile(userId: string): Promise<ProviderProfileDocument> {
    const profile = await this.providerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!profile) throw new ForbiddenException('Provider profile not found');
    return profile;
  }

  async create(userId: string, dto: CreatePortfolioItemDto): Promise<PortfolioItemDocument> {
    const profile = await this.getProviderProfile(userId);
    const item = new this.itemModel({
      providerId: profile._id,
      title: dto.title,
      description: dto.description ?? '',
      imageUrls: dto.imageUrls ?? [],
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      displayOrder: dto.displayOrder ?? 0,
    });
    return item.save();
  }

  async findByProvider(providerId: string): Promise<PortfolioItemDocument[]> {
    return this.itemModel
      .find({ providerId: new Types.ObjectId(providerId) })
      .populate('categoryId', 'name')
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean()
      .exec() as unknown as Promise<PortfolioItemDocument[]>;
  }

  async findMine(userId: string): Promise<PortfolioItemDocument[]> {
    const profile = await this.getProviderProfile(userId);
    return this.findByProvider(profile._id.toString());
  }

  async update(id: string, userId: string, dto: UpdatePortfolioItemDto): Promise<PortfolioItemDocument> {
    const profile = await this.getProviderProfile(userId);
    const item = await this.itemModel.findById(id).exec();
    if (!item) throw new NotFoundException('Portfolio item not found');
    if (item.providerId.toString() !== profile._id.toString()) {
      throw new ForbiddenException('Not your item');
    }
    if (dto.title !== undefined) item.title = dto.title;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.imageUrls !== undefined) item.imageUrls = dto.imageUrls;
    if (dto.categoryId !== undefined) item.categoryId = dto.categoryId ? new Types.ObjectId(dto.categoryId) : null;
    if (dto.completedAt !== undefined) item.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    if (dto.displayOrder !== undefined) item.displayOrder = dto.displayOrder;
    return item.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const profile = await this.getProviderProfile(userId);
    const res = await this.itemModel.deleteOne({ _id: id, providerId: profile._id }).exec();
    if (res.deletedCount === 0) throw new NotFoundException('Portfolio item not found');
  }
}
