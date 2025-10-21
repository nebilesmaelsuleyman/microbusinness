import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /** Send a message from one user to another. */
  async send(senderId: string, recipientId: string, body: string): Promise<MessageDocument> {
    if (senderId === recipientId) {
      throw new BadRequestException('You cannot message yourself');
    }
    const recipient = await this.userModel.exists({ _id: new Types.ObjectId(recipientId) });
    if (!recipient) throw new NotFoundException('Recipient not found');

    return this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      recipientId: new Types.ObjectId(recipientId),
      body: body.trim(),
    });
  }

  /**
   * The full message thread between the current user and another user, oldest first.
   * Also marks messages addressed to the current user as read (side effect of opening it).
   */
  async getThread(userId: string, otherUserId: string): Promise<MessageDocument[]> {
    const me = new Types.ObjectId(userId);
    const other = new Types.ObjectId(otherUserId);

    await this.messageModel
      .updateMany({ senderId: other, recipientId: me, readAt: null }, { $set: { readAt: new Date() } })
      .exec();

    return this.messageModel
      .find({
        $or: [
          { senderId: me, recipientId: other },
          { senderId: other, recipientId: me },
        ],
      })
      .sort({ createdAt: 1 })
      .lean()
      .exec() as unknown as Promise<MessageDocument[]>;
  }

  /**
   * One entry per person the user has exchanged messages with: the other user's
   * basic info, the last message, and how many are unread (sent to the user).
   */
  async getConversations(userId: string) {
    const me = new Types.ObjectId(userId);
    const rows = await this.messageModel.aggregate([
      { $match: { $or: [{ senderId: me }, { recipientId: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', me] }, '$recipientId', '$senderId'],
          },
          lastMessage: { $first: '$body' },
          lastAt: { $first: '$createdAt' },
          lastSenderId: { $first: '$senderId' },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$recipientId', me] }, { $eq: ['$readAt', null] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          profilePhoto: '$user.profilePhoto',
          role: '$user.role',
          lastMessage: 1,
          lastAt: 1,
          unread: 1,
          fromMe: { $eq: ['$lastSenderId', me] },
        },
      },
    ]);
    return rows;
  }

  /** Total unread messages addressed to the user (for the nav badge). */
  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.messageModel
      .countDocuments({ recipientId: new Types.ObjectId(userId), readAt: null })
      .exec();
    return { count };
  }
}
