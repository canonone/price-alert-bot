export type AlertType = 'SL' | 'TP' | 'TARGET'

export interface PriceAlert {
  id: number
  symbol: string
  type: AlertType
  targetPrice: number
  createdAt: Date
  active: boolean
}