import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
  ) {
    return this.supportService.create(userId, subject, message);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.findAll(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string,
  ) {
    return this.supportService.findById(userId, ticketId);
  }

  @Patch(':id/message')
  @HttpCode(HttpStatus.OK)
  async addMessage(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string,
    @Body('message') message: string,
  ) {
    return this.supportService.addMessage(userId, ticketId, message);
  }
}
