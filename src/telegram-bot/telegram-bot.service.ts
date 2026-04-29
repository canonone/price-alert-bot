import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PriceAlertService } from '../price-alert/price-alert.service'
import { AlertType } from '../price-alert/price-alert.types'
import axios from 'axios'

@Injectable()
export class TelegramBotService implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotService.name)
  private readonly botToken: string
  private readonly chatId: string
  private readonly baseUrl: string
  private lastUpdateId = 0

  constructor(
    private configService: ConfigService,
    private priceAlertService: PriceAlertService,
  ) {
    this.botToken = this.configService.getOrThrow('TELEGRAM_BOT_TOKEN')
    this.chatId = this.configService.getOrThrow('TELEGRAM_CHAT_ID')
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  onModuleInit() {
    this.logger.log('Telegram bot polling started...')
    this.startPolling()
  }

  private startPolling() {
    setInterval(async () => {
      await this.pollUpdates()
    }, 3000)
  }

  private async pollUpdates(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/getUpdates`, {
        params: {
          offset: this.lastUpdateId + 1,
          timeout: 1,
        },
      })

      const updates = response.data.result
      if (!updates || updates.length === 0) return

      for (const update of updates) {
        this.lastUpdateId = update.update_id
        const message = update.message
        if (!message || !message.text) continue

        const fromChatId = String(message.chat.id)
        if (fromChatId !== this.chatId) continue

        await this.handleCommand(message.text.trim())
      }
    } catch {
      // Silently ignore polling errors
    }
  }

  private async handleCommand(text: string): Promise<void> {
    const parts = text.split(' ').filter(Boolean)
    const command = parts[0].toLowerCase()

    switch (command) {
      case '/setalert':
        await this.handleSetAlert(parts)
        break
      case '/listalerts':
        await this.handleListAlerts()
        break
      case '/cancelalert':
        await this.handleCancelAlert(parts)
        break
      case '/cancelalerts':
        await this.handleCancelAlerts(parts)
        break
      case '/help':
      case '/start':
        await this.handleHelp()
        break
      default:
        break
    }
  }

  private async handleSetAlert(parts: string[]): Promise<void> {
    if (parts.length !== 4) {
      await this.sendMessage(
        `❌ <b>Invalid format</b>\n\n` +
        `Usage: <code>/setalert [SYMBOL] [TYPE] [PRICE]</code>\n\n` +
        `Examples:\n` +
        `<code>/setalert GBPUSD SL 1.3200</code>\n` +
        `<code>/setalert EURUSD TP 1.1500</code>\n` +
        `<code>/setalert XAUUSD TARGET 3300.00</code>`,
      )
      return
    }

    const symbol = parts[1].toUpperCase()
    const type = parts[2].toUpperCase()
    const price = parseFloat(parts[3])

    if (!['SL', 'TP', 'TARGET'].includes(type)) {
      await this.sendMessage(
        `❌ Invalid type <b>${type}</b>\n\nValid types: <b>SL</b> | <b>TP</b> | <b>TARGET</b>`,
      )
      return
    }

    const result = this.priceAlertService.addAlert(symbol, type as AlertType, price)
    await this.sendMessage(result.message)
  }

  private async handleListAlerts(): Promise<void> {
    await this.sendMessage(this.priceAlertService.listAlerts())
  }

  private async handleCancelAlert(parts: string[]): Promise<void> {
    if (parts.length !== 2) {
      await this.sendMessage(
        `❌ <b>Invalid format</b>\n\nUsage: <code>/cancelalert [ID]</code>\n\nExample: <code>/cancelalert 3</code>`,
      )
      return
    }

    const id = parseInt(parts[1])
    if (isNaN(id)) {
      await this.sendMessage(`❌ Invalid ID. Please use a number.`)
      return
    }

    const result = this.priceAlertService.cancelAlert(id)
    await this.sendMessage(result.message)
  }

  private async handleCancelAlerts(parts: string[]): Promise<void> {
    if (parts.length !== 2) {
      await this.sendMessage(
        `❌ <b>Invalid format</b>\n\nUsage: <code>/cancelalerts [SYMBOL]</code>\n\nExample: <code>/cancelalerts GBPUSD</code>`,
      )
      return
    }

    const result = this.priceAlertService.cancelAlertsBySymbol(parts[1])
    await this.sendMessage(result.message)
  }

  private async handleHelp(): Promise<void> {
    await this.sendMessage(
      `🤖 <b>Price Alert Bot</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Commands</b>\n\n` +
      `📌 <code>/setalert [SYMBOL] [TYPE] [PRICE]</code>\n` +
      `Set a new price alert\n\n` +
      `📋 <code>/listalerts</code>\n` +
      `View all active alerts\n\n` +
      `❌ <code>/cancelalert [ID]</code>\n` +
      `Cancel alert by ID\n\n` +
      `🗑 <code>/cancelalerts [SYMBOL]</code>\n` +
      `Cancel all alerts for a symbol\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Alert Types</b>\n\n` +
      `🔴 <b>SL</b> — fires when price drops to your level\n` +
      `🟢 <b>TP</b> — fires when price rises to your level\n` +
      `🎯 <b>TARGET</b> — fires when price reaches level from any direction\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `<b>Examples</b>\n\n` +
      `<code>/setalert GBPUSD SL 1.3200</code>\n` +
      `<code>/setalert EURUSD TP 1.1500</code>\n` +
      `<code>/setalert XAUUSD TARGET 3300.00</code>\n\n` +
      `Prices checked every 15 minutes ⏱`,
    )
  }

  async sendMessage(text: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML',
      })
    } catch (error) {
      this.logger.error('Failed to send message', error)
    }
  }
}