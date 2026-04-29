import { Module, forwardRef } from '@nestjs/common'
import { TelegramBotService } from './telegram-bot.service'
import { PriceAlertModule } from '../price-alert/price-alert.module'

@Module({
  imports: [forwardRef(() => PriceAlertModule)],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}