import type { VercelRequest, VercelResponse } from '@vercel/node';
import { aggregatorService } from '../../backend/services/aggregatorService';
import { redisService } from '../../backend/services/redisService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron jobs include a special header
  const cronSecret = req.headers['x-vercel-cron-secret'];
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const startTime = Date.now();
    const tokens = await aggregatorService.aggregateAllSources();
    const duration = Date.now() - startTime;

    console.log(`[CRON] Aggregated ${tokens.length} tokens in ${duration}ms`);

    // Check for volatile tokens to broadcast as immediate updates
    const updates = tokens
      .filter(t => Math.abs(t.price_1hr_change) > 5) // Broadcast big moves
      .slice(0, 10)
      .map(t => ({
        token_address: t.token_address,
        price_usd: t.price_usd,
        price_sol: t.price_sol,
        last_updated: Date.now()
      }));

    if (updates.length > 0) {
      await redisService.broadcastUpdates(updates);
      console.log(`[CRON] Broadcast ${updates.length} volatile token updates`);
    }

    return res.status(200).json({
      success: true,
      tokensCount: tokens.length,
      updatesCount: updates.length,
      duration
    });
  } catch (error) {
    console.error('[CRON] Aggregation job failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
