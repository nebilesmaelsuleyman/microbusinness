import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name) private convModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private msgModel: Model<MessageDocument>,
    private notificationsService: NotificationsService,
  ) {}

  private async findOrCreateConversation(
    userA: string,
    userB: string,
    jobId?: string,
  ): Promise<ConversationDocument> {
    const ids = [new Types.ObjectId(userA), new Types.ObjectId(userB)];
    const existing = await this.convModel.findOne({
      participants: { $all: ids, $size: 2 },
    }).exec();
    if (existing) return existing;
    const conv = new this.convModel({
      participants: ids,
      jobId: jobId ? new Types.ObjectId(jobId) : null,
    });
    return conv.save();
  }

  async send(senderId: string, dto: SendMessageDto): Promise<MessageDocument> {
    let conv: ConversationDocument;
    if (dto.conversationId) {
      const found = await this.convModel.findById(dto.conversationId).exec();
      if (!found) throw new NotFoundException('Conversation not found');
      conv = found;
      if (!conv.participants.some((p) => p.toString() === senderId)) {
        throw new ForbiddenException('Not a participant');
      }
    } else if (dto.recipientId) {
      if (dto.recipientId === senderId) {
        throw new BadRequestException('Cannot message yourself');
      }
      conv = await this.findOrCreateConversation(senderId, dto.recipientId, dto.jobId);
    } else {
      throw new BadRequestException('conversationId or recipientId required');
    }

    const msg = new this.msgModel({
      conversationId: conv._id,
      senderId: new Types.ObjectId(senderId),
      text: dto.text,
      readBy: [new Types.ObjectId(senderId)],
    });
    await msg.save();

    conv.lastMessage = dto.text.slice(0, 200);
    conv.lastMessageAt = new Date();
    await conv.save();

    const recipients = conv.participants.filter((p) => p.toString() !== senderId);
    for (const r of recipients) {
      await this.notificationsService.create(
        r.toString(),
        NotificationType.NEW_MESSAGE,
        'New message',
        dto.text.slice(0, 100),
        { conversationId: conv._id.toString() },
      );
    }

    return msg;
  }

  async listConversations(userId: string): Promise<ConversationDocument[]> {
    return this.convModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'name phoneNumber profilePhoto')
      .sort({ lastMessageAt: -1 })
      .lean()
      .exec() as unknown as Promise<ConversationDocument[]>;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    before?: string,
  ): Promise<MessageDocument[]> {
    const conv = await this.convModel.findById(conversationId).exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('Not a participant');
    }
    const filter: Record<string, unknown> = { conversationId: new Types.ObjectId(conversationId) };
    if (before) filter.createdAt = { $lt: new Date(before) };
    return this.msgModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as unknown as Promise<MessageDocument[]>;
  }

  async markConversationRead(conversationId: string, userId: string): Promise<{ modified: number }> {
    const conv = await this.convModel.findById(conversationId).exec();
    if (!conv) throw new NotFoundException('Conversation not found');
    if (!conv.participants.some((p) => p.toString() === userId)) {
      throw new ForbiddenException('Not a participant');
    }
    const res = await this.msgModel.updateMany(
      { conversationId: new Types.ObjectId(conversationId), readBy: { $ne: new Types.ObjectId(userId) } },
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
    ).exec();
    return { modified: res.modifiedCount };
  }

  async countUnread(userId: string): Promise<number> {
    const convs = await this.convModel.find({ participants: new Types.ObjectId(userId) }).select('_id').exec();
    const convIds = convs.map((c) => c._id);
    return this.msgModel.countDocuments({
      conversationId: { $in: convIds },
      senderId: { $ne: new Types.ObjectId(userId) },
      readBy: { $ne: new Types.ObjectId(userId) },
    }).exec();
  }
}
