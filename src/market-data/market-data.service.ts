import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export interface OHLCVCandle {
  datetime: string
  open: number
  high: number
  low: number
  close: number
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name)
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.twelvedata.com'

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow('TWELVE_DATA_API_KEY')
  }

  private formatSymbol(symbol: string): string {
    if (symbol === 'XAUUSD') return 'XAU/USD'
    if (symbol === 'XAGUSD') return 'XAG/USD'
    if (symbol.length === 6) {
      return `${symbol.slice(0, 3)}/${symbol.slice(3)}`
    }
    return symbol
  }

  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/price`, {
        params: {
          symbol: this.formatSymbol(symbol),
          apikey: this.apiKey,
        },
      })

      if (response.data.status === 'error') {
        this.logger.error(
          `Twelve Data error for ${symbol}: ${response.data.message}`,
        )
        return null
      }

      return parseFloat(response.data.price)
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${symbol}`, error)
      return null
    }
  }
}