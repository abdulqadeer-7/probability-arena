import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  async exportData(@CurrentUser('id') userId: string) {
    return this.usersService.exportData(userId);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  async getSessions(@CurrentUser('id') userId: string) {
    return this.usersService.getSessions(userId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async terminateSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.usersService.terminateSession(userId, sessionId);
  }
}
