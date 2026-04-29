import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { MarketDataModule } from './market-data/market-data.module'
import { PriceAlertModule } from './price-alert/price-alert.module'
import { TelegramBotModule } from './telegram-bot/telegram-bot.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MarketDataModule,
    PriceAlertModule,
    TelegramBotModule,
  ],
})
export class AppModule {}