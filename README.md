<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1fV5pRUyDl_HUDoPHR0jPS3EITaTXNyiE

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. Set up environment variables in `.env.local`:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6380  # Optional: For Redis caching
   ```

3. Run the app:
   ```bash
   # Terminal 1: Start backend server
   cd backend && npm run start
   
   # Terminal 2: Start worker (optional)
   cd backend && npm run worker
   
   # Terminal 3: Start frontend
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

**Note:** Redis is optional but recommended for full functionality. Without Redis, the app will work but won't cache data or provide real-time updates.

## Deploy to Vercel (Free)

This project is configured for easy deployment to Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for a complete step-by-step guide.

**Quick Deploy:**

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set environment variables (REDIS_URL, CRON_SECRET)
4. Deploy!

The frontend will automatically use the backend API in production.
