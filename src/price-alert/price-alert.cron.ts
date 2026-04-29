import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PriceAlertService } from './price-alert.service'
import { TelegramBotService } from '../telegram-bot/telegram-bot.service'

@Injectable()
export class PriceAlertCron {
  private readonly logger = new Logger(PriceAlertCron.name)

  constructor(
    private priceAlertService: PriceAlertService,
    private telegramBot: TelegramBotService,
  ) {}

  @Cron('*/15 * * * *', { timeZone: 'UTC' })
  async checkPrices() {
    this.logger.log('[CRON] Price alert check triggered')
    const triggered = await this.priceAlertService.checkAllAlerts()

    for (const { alert, currentPrice } of triggered) {
      const message = this.priceAlertService.buildAlertMessage(alert, currentPrice)
      await this.telegramBot.sendMessage(message)
    }
  }
}