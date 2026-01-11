# 🚀 Quick Deploy to Vercel (Free) - Step by Step

This is a simplified guide to deploy your Memestream Aggregator to Vercel for free.

## ✅ What You Need (All Free)

1. **GitHub Account** - [github.com](https://github.com) (free)
2. **Vercel Account** - [vercel.com](https://vercel.com) (free)
3. **Upstash Redis** - [upstash.com](https://upstash.com) (free tier)

---

## 📝 Step-by-Step Instructions

### Step 1: Set Up Upstash Redis (2 minutes)

1. Go to **[console.upstash.com](https://console.upstash.com)**
2. Click **"Sign Up"** (free account)
3. Click **"Create Database"**
4. Fill in:
   - **Name**: `memestream-redis` (or any name)
   - **Type**: Redis
   - **Region**: Choose closest to you
   - **Tier**: **Free**
5. Click **"Create"**
6. Once created, click on your database
7. Copy the **Redis URL** (looks like: `rediss://default:xxxxx@xxxxx.upstash.io:6380`)
   - Save this - you'll need it in Step 4

### Step 2: Push Code to GitHub (3 minutes)

1. **Initialize git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a new repository on GitHub:**
   - Go to [github.com/new](https://github.com/new)
   - Name it: `memestream-aggregator`
   - Choose **Public** (required for free Vercel)
   - Click **"Create repository"**

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/memestream-aggregator.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

### Step 3: Deploy to Vercel (5 minutes)

1. **Go to [vercel.com](https://vercel.com)**
2. Click **"Sign Up"** (use GitHub to sign in)
3. Click **"Add New..."** → **"Project"**
4. **Import your GitHub repository:**
   - Find `memestream-aggregator`
   - Click **"Import"**

5. **Configure Project Settings:**
   - **Framework Preset**: `Other` or `Vite`
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - Click **"Deploy"** (you can add environment variables later)

6. **Wait for deployment** (~2-3 minutes)
   - Vercel will build your project
   - You'll see build logs in real-time
   - When done, you'll get a URL like: `https://your-project.vercel.app`

### Step 4: Add Environment Variables (2 minutes)

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**

2. **Add these variables:**

   a. **REDIS_URL**
      - **Key**: `REDIS_URL`
      - **Value**: Your Upstash Redis URL (from Step 1)
      - **Environment**: Production, Preview, Development (check all)
      - Click **"Save"**

   b. **CRON_SECRET** (optional but recommended)
      - **Key**: `CRON_SECRET`
      - **Value**: Any random string (e.g., `my-secret-key-12345`)
      - **Environment**: Production, Preview, Development (check all)
      - Click **"Save"**

3. **Redeploy** to apply changes:
   - Go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"**

### Step 5: Verify Deployment (1 minute)

1. **Visit your site**: `https://your-project.vercel.app`
2. **Test the API**: `https://your-project.vercel.app/api/tokens`
3. **Check logs** (optional):
   - Go to **Deployments** → Click on latest deployment → **Functions** tab
   - Check for any errors

### Step 6: Enable Cron Job (Automatic)

The cron job is already configured in `vercel.json`. It should automatically work, but to verify:

1. Go to **Settings** → **Cron Jobs**
2. You should see: `/api/cron/aggregate` scheduled every 5 minutes
3. If not visible, it might need a few minutes to appear after first deployment

---

## 🎉 You're Done!

Your app is now live at: `https://your-project.vercel.app`

### What's Working:
✅ Frontend deployed  
✅ API endpoints working (`/api/tokens`)  
✅ Redis caching (via Upstash)  
✅ Cron job running every 5 minutes  
✅ All on free tier!

---

## 🔧 Troubleshooting

### Build Failed?
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Try running `npm run build` locally first

### API Returns Empty Data?
- Check that `REDIS_URL` is set correctly
- Wait a few minutes for the cron job to populate data
- Check Upstash Redis dashboard to see if data is being written

### Cron Job Not Running?
- Wait 5-10 minutes after deployment
- Check Vercel logs in the Functions tab
- Verify cron job is listed in Settings → Cron Jobs

### Need Help?
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)

---

## 📊 Free Tier Limits

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (10s timeout)
- ✅ Cron jobs (minimum 1-minute intervals)

### Upstash Redis Free Tier:
- ✅ 10,000 commands/day
- ✅ 256 MB storage
- ✅ Global replication

**These limits are generous and should be enough for most projects!**
