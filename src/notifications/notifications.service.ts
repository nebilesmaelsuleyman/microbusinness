import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationType } from '../common/enums';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<NotificationDocument> {
    const notif = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      type,
      title,
      body: body ?? '',
      data: data ?? {},
    });
    return notif.save();
  }

  async findForUser(userId: string, unreadOnly = false): Promise<NotificationDocument[]> {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) filter.read = false;
    return this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec() as unknown as Promise<NotificationDocument[]>;
  }

  async markRead(id: string, userId: string): Promise<NotificationDocument> {
    const notif = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { read: true },
      { new: true },
    ).exec();
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async markAllRead(userId: string): Promise<{ modified: number }> {
    const res = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    ).exec();
    return { modified: res.modifiedCount };
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    }).exec();
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.notificationModel.deleteOne({
      _id: id,
      userId: new Types.ObjectId(userId),
    }).exec();
  }
}
