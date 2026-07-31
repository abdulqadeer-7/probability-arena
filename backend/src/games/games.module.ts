import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GamesController } from './games.controller';
import { GameEngineService } from './game-engine.service';
import { FlightCurveService } from './flight-curve/flight-curve.service';
import { DiceService } from './dice/dice.service';
import { CoinFlipService } from './coin-flip/coin-flip.service';
import { SlotsService } from './slots/slots.service';
import { WheelService } from './wheel/wheel.service';
import { CardTrainerService } from './card-trainer/card-trainer.service';
import { GameGateway } from './game.gateway';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
    WalletModule,
  ],
  controllers: [GamesController],
  providers: [
    GameEngineService,
    FlightCurveService,
    DiceService,
    CoinFlipService,
    SlotsService,
    WheelService,
    CardTrainerService,
    GameGateway,
  ],
  exports: [
    GameEngineService,
    FlightCurveService,
    DiceService,
    CoinFlipService,
    SlotsService,
    WheelService,
    CardTrainerService,
  ],
})
export class GamesModule {}
