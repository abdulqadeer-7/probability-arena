import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  async getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetBalance(@CurrentUser('id') userId: string) {
    return this.walletService.resetBalance(userId);
  }

  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.walletService.getTransactions(
      userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(@CurrentUser('id') userId: string) {
    return this.walletService.getStats(userId);
  }
}
