import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LeaderboardPeriod } from '@prisma/client';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async getLeaderboard(
    @Query('gameId') gameId?: string,
    @Query('period') period?: LeaderboardPeriod,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.leaderboardService.getLeaderboard(
      gameId,
      period,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('my-rank')
  @HttpCode(HttpStatus.OK)
  async getMyRank(
    @CurrentUser('id') userId: string,
    @Query('gameId') gameId?: string,
    @Query('period') period?: LeaderboardPeriod,
  ) {
    return this.leaderboardService.getMyRank(userId, gameId, period);
  }
}
