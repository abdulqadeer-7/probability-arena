import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async getActiveChallenges() {
    return this.challengesService.getActiveChallenges();
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  async getMyProgress(@CurrentUser('id') userId: string) {
    return this.challengesService.getMyProgress(userId);
  }

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  async claimReward(
    @CurrentUser('id') userId: string,
    @Param('id') challengeId: string,
  ) {
    return this.challengesService.claimReward(userId, challengeId);
  }
}
