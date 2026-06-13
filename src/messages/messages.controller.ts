import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser('sub') userId: string, @Body() dto: SendMessageDto) {
    return this.messagesService.send(userId, dto);
  }

  @Get('conversations')
  listConversations(@CurrentUser('sub') userId: string) {
    return this.messagesService.listConversations(userId);
  }

  @Get('conversations/:id')
  getMessages(
    @CurrentUser('sub') userId: string,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getMessages(
      conversationId,
      userId,
      limit ? parseInt(limit, 10) : 50,
      before,
    );
  }

  @Patch('conversations/:id/read')
  markRead(@CurrentUser('sub') userId: string, @Param('id') conversationId: string) {
    return this.messagesService.markConversationRead(conversationId, userId);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('sub') userId: string) {
    const count = await this.messagesService.countUnread(userId);
    return { count };
  }
}
