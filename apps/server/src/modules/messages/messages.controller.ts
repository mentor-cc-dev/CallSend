import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { MessagesService, DispatchMessageDto } from './messages.service';

@Controller('api/v1/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('dispatch')
  async dispatch(@Body() dto: DispatchMessageDto) {
    return this.messagesService.dispatchMessage(dto);
  }

  @Get('logs/:organizationId')
  async getLogs(
    @Param('organizationId') organizationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getLogs(organizationId, limit ? parseInt(limit, 10) : 50);
  }
}
