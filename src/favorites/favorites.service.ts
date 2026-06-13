import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
  ) {}

  async add(customerId: string, providerId: string): Promise<FavoriteDocument> {
    const existing = await this.favoriteModel.findOne({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
    }).exec();
    if (existing) return existing;
    const fav = new this.favoriteModel({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
    });
    return fav.save();
  }

  async remove(customerId: string, providerId: string): Promise<{ deleted: boolean }> {
    const result = await this.favoriteModel.deleteOne({
      customerId: new Types.ObjectId(customerId),
      providerId: new Types.ObjectId(providerId),
    }).exec();
    return { deleted: result.deletedCount > 0 };
  }

  async list(customerId: string): Promise<FavoriteDocument[]> {
    return this.favoriteModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .populate('providerId')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as Promise<FavoriteDocument[]>;
  }
}
