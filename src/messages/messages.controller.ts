import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser('sub') userId: string, @Body() dto: SendMessageDto) {
    return this.messagesService.send(userId, dto.recipientId, dto.body);
  }

  @Get('conversations')
  conversations(@CurrentUser('sub') userId: string) {
    return this.messagesService.getConversations(userId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('sub') userId: string) {
    return this.messagesService.unreadCount(userId);
  }

  @Get('thread/:otherUserId')
  thread(@CurrentUser('sub') userId: string, @Param('otherUserId') otherUserId: string) {
    return this.messagesService.getThread(userId, otherUserId);
  }
}
