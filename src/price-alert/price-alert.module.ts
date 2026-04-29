import { Module, forwardRef } from '@nestjs/common'
import { PriceAlertService } from './price-alert.service'
import { PriceAlertCron } from './price-alert.cron'
import { MarketDataModule } from '../market-data/market-data.module'
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module'

@Module({
  imports: [
    MarketDataModule,
    forwardRef(() => TelegramBotModule),
  ],
  providers: [PriceAlertService, PriceAlertCron],
  exports: [PriceAlertService],
})
export class PriceAlertModule {}