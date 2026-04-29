# 📈 Price Alert Bot

A Telegram-based price alert system for Currency and Gold (XAUUSD) traders. Set Stop Loss, Take Profit, and Target Price alerts directly from Telegram and get notified the moment price reaches your level.

## ✨ Features

- 🔴 **Stop Loss (SL)** alerts — fires when price drops to your level
- 🟢 **Take Profit (TP)** alerts — fires when price rises to your level
- 🎯 **Target Price** alerts — fires when price reaches your level from any direction
- 📱 **Telegram native notifications** — uses Telegram's push notification system
- ⚡ **Command-based interface** — set and manage alerts directly from Telegram
- 🔄 **Auto-cancel** — alerts automatically cancel after being triggered
- ⏱ **15-minute price checks** — prices polled every 15 minutes
- 🌍 **29 Forex pairs + XAUUSD** supported

## 📊 Supported Symbols

### Forex Pairs
| AUD | CAD | CHF | EUR | GBP | NZD | USD |
|-----|-----|-----|-----|-----|-----|-----|
| AUDCAD | CADCHF | CHFJPY | EURAUD | GBPAUD | NZDCAD | USDCAD |
| AUDCHF | CADJPY | | EURCAD | GBPCAD | NZDCHF | USDCHF |
| AUDJPY | | | EURCHF | GBPCHF | NZDJPY | USDJPY |
| AUDNZD | | | EURGBP | GBPJPY | NZDUSD | |
| AUDUSD | | | EURJPY | GBPNZD | | |
| | | | EURNZD | GBPUSD | | |
| | | | EURUSD | | | |

### Commodities
- **XAUUSD** (Gold / US Dollar)

## 🤖 Telegram Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/setalert [SYMBOL] [TYPE] [PRICE]` | Set a new price alert | `/setalert GBPUSD SL 1.3200` |
| `/listalerts` | View all active alerts | `/listalerts` |
| `/cancelalert [ID]` | Cancel a specific alert by ID | `/cancelalert 3` |
| `/cancelalerts [SYMBOL]` | Cancel all alerts for a symbol | `/cancelalerts GBPUSD` |
| `/help` | Show help menu | `/help` |

## 📬 Alert Examples

### Stop Loss Hit
```
🔴 STOP LOSS HIT — GBPUSD

━━━━━━━━━━━━━━━━━━━━
💀 SL Level: 1.3200
📉 Current Price: 1.3198
🕐 Time: 2026-04-29 14:00 WAT
━━━━━━━━━━━━━━━━━━━━
⚠️ Cut your losses. Protect your capital.
```

### Take Profit Hit
```
🟢 TAKE PROFIT HIT — EURUSD

━━━━━━━━━━━━━━━━━━━━
🎯 TP Level: 1.1500
📈 Current Price: 1.1502
🕐 Time: 2026-04-29 16:00 WAT
━━━━━━━━━━━━━━━━━━━━
💰 Well done. Lock in those gains.
```

### Target Price Hit
```
🎯 TARGET PRICE HIT — XAUUSD

━━━━━━━━━━━━━━━━━━━━
📍 Target: 3300.00
💰 Current Price: 3300.45
🕐 Time: 2026-04-29 18:00 WAT
━━━━━━━━━━━━━━━━━━━━
📊 Your target level has been reached.
```

## 🛠 Tech Stack

- **Runtime** — Node.js
- **Framework** — NestJS
- **Language** — TypeScript
- **Market Data** — Twelve Data API
- **Notifications** — Telegram Bot API
- **Hosting** — Railway
- **Scheduling** — @nestjs/schedule (cron jobs)

## 🚀 Setup & Deployment

### Prerequisites
- Node.js v18+
- npm
- Telegram account
- Twelve Data API key (free tier)
- Railway account

### 1. Clone the Repository
```bash
git clone git@github.com:canonone/price-alert-bot.git
cd price-alert-bot
npm install
```

### 2. Create Telegram Bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy your **Bot Token**
4. Start a chat with your bot and send any message
5. Visit `https://api.telegram.org/bot[TOKEN]/getUpdates`
6. Copy your **Chat ID** from the response

### 3. Get Twelve Data API Key
1. Sign up at [twelvedata.com](https://twelvedata.com)
2. Copy your API key from the dashboard

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```env
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_CHAT_ID=your-chat-id-here
TWELVE_DATA_API_KEY=your-twelve-data-key-here
PORT=3000
```

### 5. Run Locally
```bash
npm run start:dev
```

Open Telegram and send `/start` to your bot to confirm it's working.

### 6. Deploy to Railway
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repository
4. Add environment variables in the **Variables** tab
5. Go to **Settings → Networking → Generate Domain**

## 📁 Project Structure

```
price-alert-bot/
├── src/
│   ├── market-data/
│   │   ├── market-data.module.ts     # Market data module
│   │   └── market-data.service.ts    # Twelve Data API integration
│   ├── price-alert/
│   │   ├── price-alert.module.ts     # Price alert module
│   │   ├── price-alert.service.ts    # Alert management & price checking
│   │   ├── price-alert.cron.ts       # 15-minute cron job
│   │   └── price-alert.types.ts      # TypeScript interfaces
│   ├── telegram-bot/
│   │   ├── telegram-bot.module.ts    # Telegram bot module
│   │   └── telegram-bot.service.ts   # Command handling & message sending
│   ├── app.module.ts                 # Root application module
│   └── main.ts                       # Application entry point
├── .env                              # Environment variables (not committed)
├── .gitignore
├── package.json
└── README.md
```

## ⚙️ How It Works

```
You type a command in Telegram
        ↓
Bot receives command via long polling (every 3 seconds)
        ↓
Alert is saved in memory with symbol, type and target price
        ↓
Cron job runs every 15 minutes
        ↓
Fetches current price from Twelve Data for each active alert
        ↓
Checks if price condition is met (SL / TP / TARGET)
        ↓
If triggered → sends Telegram notification → auto-cancels alert
```

## ⚠️ Important Notes

- **Alerts are stored in memory** — if the server restarts, active alerts will be lost. Re-set your alerts after any redeployment.
- **15-minute resolution** — alerts fire within 15 minutes of the price being reached, not instantly.
- **TARGET tolerance** — TARGET alerts fire when price is within 0.1% of your specified level.
- **Free tier limits** — Twelve Data free tier allows 800 requests/day. With 15-minute checks this supports monitoring multiple pairs simultaneously within the limit.

## 📄 License

MIT — feel free to use and modify for personal use.