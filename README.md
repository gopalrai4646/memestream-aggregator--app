# MemeStream Aggregator

A high-performance real-time meme coin data aggregator that merges multiple DEX sources (DexScreener, Jupiter) with live updates, advanced filtering, and caching. Built with React, TypeScript, and deployed on Vercel.

## 🚀 Features

- **Multi-Source Aggregation**: Combines data from DexScreener and Jupiter APIs
- **Real-Time Updates**: Live price updates and market data
- **Advanced Filtering**: Filter by time period (1h, 24h, 7d) and sort by volume, price change, market cap, or liquidity
- **Pagination**: Efficient cursor-based pagination for large datasets
- **Redis Caching**: Fast data retrieval with Redis caching layer
- **Responsive UI**: Modern, clean interface with real-time log terminal
- **Serverless Architecture**: Deployed on Vercel with serverless functions
- **Automated Data Refresh**: Cron jobs for scheduled data aggregation



## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Express, Node.js, TypeScript
- **Cache**: Redis (ioredis)
- **Deployment**: Vercel (Serverless Functions)
- **APIs**: DexScreener API, Jupiter API
- **Build Tool**: Vite
- **HTTP Client**: Axios with retry logic

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd memestream-aggregator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env.local` file in the root directory:
   ```env
   REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6380
   CRON_SECRET=your-secret-key-here
   ```

   > **Note**: Don't commit `.env.local` to git. Add it to `.gitignore`.

4. **Get a Redis URL**:
   - Sign up at [Upstash](https://upstash.com) (free tier available)
   - Create a Redis database
   - Copy the Redis URL

## 🚀 Local Development

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to `http://localhost:5173` (or the port shown in terminal)

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```


## 📁 Project Structure

```
memestream-aggregator/
├── api/                    # Vercel serverless functions
│   ├── cron/
│   │   └── aggregate.ts    # Cron job for data aggregation
│   └── tokens.ts           # API endpoint for token data
├── backend/                # Backend services
│   ├── services/
│   │   ├── aggregatorService.ts  # Data aggregation logic
│   │   └── redisService.ts       # Redis cache management
│   └── workers/
│       └── aggregatorWorker.ts   # Worker for local development
├── components/             # React components
│   ├── ui/                 # UI components
│   ├── TokenTable.tsx      # Main token table component
│   └── TokenRow.tsx        # Token row component
├── services/               # Frontend services
│   └── apiService.ts       # API client service
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main application component
├── index.tsx               # Entry point
├── vercel.json             # Vercel configuration
└── package.json            # Dependencies and scripts
```

## 🔌 API Endpoints

### GET `/api/tokens`

Fetch paginated token data.

**Query Parameters**:
- `cursor` (optional): Pagination cursor (default: "0")
- `limit` (optional): Number of tokens per page (default: 25)

**Response**:
```json
{
  "tokens": TokenData[],
  "nextCursor": string | null,
  "total": number
}
```

### GET `/api/cron/aggregate`

Trigger manual data aggregation (requires cron secret header).

**Headers**:
- `x-vercel-cron-secret`: Your CRON_SECRET value

**Response**:
```json
{
  "success": boolean,
  "tokensCount": number,
  "updatesCount": number,
  "duration": number
}
```

## 🎯 Usage

### Filtering & Sorting

- **Time Period**: Filter price changes by 1 hour, 24 hours, or 7 days
- **Sort By**: 
  - Volume (24h)
  - Price Change (%)
  - Market Cap
  - Liquidity

### Search

Use the search bar to find tokens by name or ticker symbol.

### Real-Time Updates

The application automatically refreshes data and displays updates in the log terminal.

## ⚙️ Configuration

### Cron Job Schedule

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/aggregate",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Note**: Vercel Hobby plan allows:
- Maximum 2 cron jobs across all projects
- Each cron job can run maximum once per day

For more frequent updates, upgrade to Vercel Pro.

### Redis Configuration

The application uses Redis for caching aggregated token data. Make sure your Redis instance is accessible and the `REDIS_URL` is correctly configured.



## 📊 Free Tier Limits

### Vercel Hobby Plan
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (10s timeout)
- ⚠️ Cron jobs (limited to 2 total, max once per day each)

### Upstash Redis Free Tier
- ✅ 10,000 commands/day
- ✅ 256 MB storage
- ✅ Global replication



