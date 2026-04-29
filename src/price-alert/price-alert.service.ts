import { Injectable, Logger } from '@nestjs/common'
import { PriceAlert, AlertType } from './price-alert.types'
import { MarketDataService } from '../market-data/market-data.service'

@Injectable()
export class PriceAlertService {
  private readonly logger = new Logger(PriceAlertService.name)
  private alerts: PriceAlert[] = []
  private nextId = 1

  private readonly ALLOWED_SYMBOLS = [
    'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'AUDUSD',
    'CADCHF', 'CADJPY', 'CHFJPY',
    'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP', 'EURJPY',
    'EURNZD', 'EURUSD',
    'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD', 'GBPUSD',
    'NZDCAD', 'NZDCHF', 'NZDJPY', 'NZDUSD',
    'USDCAD', 'USDCHF', 'USDJPY',
    'XAUUSD',
  ]

  constructor(private marketData: MarketDataService) {}

  // ── Alert Management ──────────────────────────────────────────

  addAlert(
    symbol: string,
    type: AlertType,
    targetPrice: number,
  ): { success: boolean; message: string } {
    const upperSymbol = symbol.toUpperCase()

    if (!this.ALLOWED_SYMBOLS.includes(upperSymbol)) {
      return {
        success: false,
        message:
          `❌ <b>${upperSymbol}</b> is not supported.\n\n` +
          `Supported pairs are all major Forex pairs and XAUUSD.`,
      }
    }

    if (isNaN(targetPrice) || targetPrice <= 0) {
      return {
        success: false,
        message: `❌ Invalid price <b>${targetPrice}</b>. Please enter a valid positive number.`,
      }
    }

    const alert: PriceAlert = {
      id: this.nextId++,
      symbol: upperSymbol,
      type,
      targetPrice,
      createdAt: new Date(),
      active: true,
    }

    this.alerts.push(alert)

    const emoji = this.getEmoji(type)
    return {
      success: true,
      message:
        `${emoji} <b>Alert Set!</b>\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 Symbol: <b>${upperSymbol}</b>\n` +
        `📌 Type: <b>${type}</b>\n` +
        `💰 Target Price: <b>${targetPrice}</b>\n` +
        `🔢 Alert ID: <b>#${alert.id}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `You'll be notified when price reaches this level.\n` +
        `Prices are checked every 15 minutes.`,
    }
  }

  cancelAlert(id: number): { success: boolean; message: string } {
    const alert = this.alerts.find((a) => a.id === id && a.active)
    if (!alert) {
      return {
        success: false,
        message: `❌ No active alert found with ID <b>#${id}</b>\n\nUse /listalerts to see your active alerts.`,
      }
    }

    alert.active = false
    return {
      success: true,
      message:
        `✅ <b>Alert Cancelled</b>\n\n` +
        `ID: #${id}\n` +
        `Symbol: ${alert.symbol}\n` +
        `Type: ${alert.type}\n` +
        `Price: ${alert.targetPrice}`,
    }
  }

  cancelAlertsBySymbol(symbol: string): { success: boolean; message: string } {
    const upperSymbol = symbol.toUpperCase()
    const active = this.alerts.filter(
      (a) => a.symbol === upperSymbol && a.active,
    )

    if (active.length === 0) {
      return {
        success: false,
        message: `❌ No active alerts found for <b>${upperSymbol}</b>`,
      }
    }

    active.forEach((a) => (a.active = false))
    return {
      success: true,
      message: `✅ Cancelled <b>${active.length}</b> alert(s) for <b>${upperSymbol}</b>`,
    }
  }

  listAlerts(): string {
    const active = this.alerts.filter((a) => a.active)

    if (active.length === 0) {
      return (
        `📭 <b>No Active Alerts</b>\n\n` +
        `Use /setalert to create one.\n\n` +
        `Example:\n` +
        `<code>/setalert GBPUSD SL 1.3200</code>`
      )
    }

    const grouped = active.reduce(
      (acc, alert) => {
        if (!acc[alert.symbol]) acc[alert.symbol] = []
        acc[alert.symbol].push(alert)
        return acc
      },
      {} as Record<string, PriceAlert[]>,
    )

    let message = `📋 <b>Active Price Alerts (${active.length})</b>\n\n`

    for (const [symbol, symbolAlerts] of Object.entries(grouped)) {
      message += `━━━━━━━━━━━━━━━━━━━━\n`
      message += `📊 <b>${symbol}</b>\n`
      for (const a of symbolAlerts) {
        const emoji = this.getEmoji(a.type)
        message += `  ${emoji} ${a.type} @ <b>${a.targetPrice}</b> — ID: <b>#${a.id}</b>\n`
      }
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`
    message += `/cancelalert [id] — cancel specific alert\n`
    message += `/cancelalerts [symbol] — cancel all for a pair`

    return message
  }

  getActiveAlerts(): PriceAlert[] {
    return this.alerts.filter((a) => a.active)
  }

  // ── Price Checking ────────────────────────────────────────────

  async checkAllAlerts(): Promise<
    Array<{ alert: PriceAlert; currentPrice: number }>
  > {
    const active = this.getActiveAlerts()
    if (active.length === 0) return []

    const symbols = [...new Set(active.map((a) => a.symbol))]
    this.logger.log(
      `Checking ${symbols.length} symbol(s) with active alerts...`,
    )

    const triggered: Array<{ alert: PriceAlert; currentPrice: number }> = []

    for (const symbol of symbols) {
      try {
        const price = await this.marketData.getCurrentPrice(symbol)
        if (price === null) {
          this.logger.warn(`Could not fetch price for ${symbol}`)
          continue
        }

        this.logger.log(`${symbol}: ${price}`)

        const symbolAlerts = active.filter(
          (a) => a.symbol === symbol && a.active,
        )

        for (const alert of symbolAlerts) {
          if (this.isTriggered(alert, price)) {
            alert.active = false // auto-cancel immediately
            triggered.push({ alert, currentPrice: price })
            this.logger.log(
              `🔔 #${alert.id} triggered — ${symbol} ${alert.type} @ ${alert.targetPrice} (price: ${price})`,
            )
          }
        }

        await this.sleep(300)
      } catch (error) {
        this.logger.error(`Error checking ${symbol}`, error)
      }
    }

    return triggered
  }

  isTriggered(alert: PriceAlert, currentPrice: number): boolean {
    switch (alert.type) {
      case 'SL':
        return currentPrice <= alert.targetPrice
      case 'TP':
        return currentPrice >= alert.targetPrice
      case 'TARGET': {
        const tolerance = alert.targetPrice * 0.001
        return Math.abs(currentPrice - alert.targetPrice) <= tolerance
      }
    }
  }

  buildAlertMessage(alert: PriceAlert, currentPrice: number): string {
    const watTime = new Date(Date.now() + 60 * 60 * 1000)
    const formattedTime =
      watTime.toISOString().replace('T', ' ').slice(0, 16) + ' WAT'

    switch (alert.type) {
      case 'SL':
        return (
          `🔴 <b>STOP LOSS HIT — ${alert.symbol}</b>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💀 <b>SL Level:</b> ${alert.targetPrice}\n` +
          `📉 <b>Current Price:</b> ${currentPrice}\n` +
          `🕐 <b>Time:</b> ${formattedTime}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `⚠️ Cut your losses. Protect your capital.`
        )
      case 'TP':
        return (
          `🟢 <b>TAKE PROFIT HIT — ${alert.symbol}</b>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🎯 <b>TP Level:</b> ${alert.targetPrice}\n` +
          `📈 <b>Current Price:</b> ${currentPrice}\n` +
          `🕐 <b>Time:</b> ${formattedTime}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 Well done. Lock in those gains.`
        )
      case 'TARGET':
        return (
          `🎯 <b>TARGET PRICE HIT — ${alert.symbol}</b>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📍 <b>Target:</b> ${alert.targetPrice}\n` +
          `💰 <b>Current Price:</b> ${currentPrice}\n` +
          `🕐 <b>Time:</b> ${formattedTime}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📊 Your target level has been reached.`
        )
    }
  }

  getEmoji(type: AlertType): string {
    switch (type) {
      case 'SL': return '🔴'
      case 'TP': return '🟢'
      case 'TARGET': return '🎯'
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}