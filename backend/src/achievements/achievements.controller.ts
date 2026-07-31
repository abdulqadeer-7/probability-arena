import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.achievementsService.findAll();
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  async findMyAchievements(@CurrentUser('id') userId: string) {
    return this.achievementsService.findMyAchievements(userId);
  }

  @Get('progress')
  @HttpCode(HttpStatus.OK)
  async getProgress(@CurrentUser('id') userId: string) {
    return this.achievementsService.getProgress(userId);
  }
}
