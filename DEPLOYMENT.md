# Deploy to Vercel - Free Tier Guide

This guide will help you deploy the Memestream Aggregator to Vercel for free.

## Prerequisites

1. **GitHub Account** (free)
2. **Vercel Account** (free at [vercel.com](https://vercel.com))
3. **Upstash Redis Account** (free tier at [upstash.com](https://upstash.com))

## Step 1: Install Vercel CLI (Optional)

You can deploy via GitHub (recommended) or using the Vercel CLI:

```bash
npm install -g vercel
```

## Step 2: Set Up Upstash Redis (Free)

1. Go to [console.upstash.com](https://console.upstash.com)
2. Sign up for a free account
3. Click "Create Database"
4. Choose:
   - **Region**: Choose closest to your users
   - **Type**: Redis
   - **Tier**: Free
5. Click "Create"
6. Copy the **Redis URL** (looks like: `rediss://default:xxxxx@xxxxx.upstash.io:6380`)

## Step 3: Prepare Your Project

### Install Required Dependencies

The project needs `@vercel/node` for serverless functions:

```bash
npm install --save-dev @vercel/node
```

### Environment Variables

Create a `.env.local` file in the root (this is for local testing):

```env
REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6380
CRON_SECRET=your-secret-key-here
```

**Note:** Don't commit `.env.local` to git. Add it to `.gitignore`.

## Step 4: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project Settings:**
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables:**
   In Vercel dashboard, go to Settings → Environment Variables and add:
   - `REDIS_URL`: Your Upstash Redis URL
   - `CRON_SECRET`: A random secret string (for cron job security)
   - `GEMINI_API_KEY`: (Optional) If you use Gemini API

5. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel

# Set environment variables
vercel env add REDIS_URL
vercel env add CRON_SECRET
vercel env add GEMINI_API_KEY  # Optional

# Deploy to production
vercel --prod
```

## Step 5: Configure Vercel Cron Job

The cron job is already configured in `vercel.json` with a schedule of `*/5 * * * *` (every 5 minutes). This works on the free tier.

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. The cron job should be automatically detected from `vercel.json`
4. If not, manually add:
   - **Path**: `/api/cron/aggregate`
   - **Schedule**: `*/5 * * * *` (every 5 minutes) - compatible with free tier
   - **Timezone**: Your preferred timezone

**Note:** Vercel free tier limitations:
- Cron jobs can run at minimum 1-minute intervals (`* * * * *`)
- The current schedule (`*/5 * * * *`) runs every 5 minutes, which is optimal for the free tier
- For more frequent updates (e.g., every 30 seconds), you would need Vercel Pro plan or use a different approach

## Step 6: Update Frontend API Configuration

Update `services/apiService.ts` to use the production API endpoint:

```typescript
// In services/apiService.ts, add this at the top:
const API_BASE_URL = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:3001';

// Then update getPaginatedTokens to use:
const response = await fetch(`${API_BASE_URL}/api/tokens?cursor=${cursor || '0'}&limit=${limit}`);
```

Alternatively, the frontend can continue using client-side aggregation, but using the API is more efficient.

## Step 7: Verify Deployment

1. Visit your deployed site: `https://your-project.vercel.app`
2. Check API endpoint: `https://your-project.vercel.app/api/tokens`
3. Check cron job in Vercel dashboard logs

## Troubleshooting

### Issue: Build Fails

- **Problem**: TypeScript errors or missing dependencies
- **Solution**: 
  - Check build logs in Vercel dashboard
  - Ensure all dependencies are in `package.json`
  - Run `npm run build` locally to test

### Issue: API Returns Empty Data

- **Problem**: Redis not connected or no data cached
- **Solution**:
  - Verify `REDIS_URL` environment variable is set correctly
  - Check Upstash Redis dashboard to see if data is being written
  - Trigger the cron job manually: `curl https://your-project.vercel.app/api/cron/aggregate`

### Issue: Cron Job Not Running

- **Problem**: Vercel cron jobs require Hobby plan or higher for frequent schedules
- **Solution**:
  - Update schedule in `vercel.json` to run less frequently (e.g., `*/5 * * * *` for every 5 minutes)
  - Or upgrade to Vercel Pro plan

### Issue: Module Import Errors

- **Problem**: ES modules vs CommonJS mismatch
- **Solution**:
  - Ensure `tsconfig.json` is configured correctly
  - Check that imports don't use `.js` extensions in TypeScript files
  - Vercel handles TypeScript compilation automatically

## Free Tier Limitations

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth per month
- ✅ Serverless functions with 10s timeout
- ⚠️ Cron jobs: Limited frequency on Hobby plan

### Upstash Redis Free Tier:
- ✅ 10,000 commands per day
- ✅ 256 MB storage
- ✅ Global replication

**Note**: For production use with high traffic, consider upgrading to paid tiers.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
