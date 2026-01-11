
import cron from 'node-cron';
import { aggregatorService } from '../services/aggregatorService';
import { redisService } from '../services/redisService';

/**
 * The Aggregator Worker runs in its own process.
 * It periodically scrapes external APIs, merges data, 
 * and identifies price deltas to push via WebSockets.
 */
class AggregatorWorker {
  static start() {
    console.log('[WORKER] Starting Aggregation Job (Interval: 30s)');
    
    // Schedule the heavy aggregation task
    cron.schedule('*/30 * * * * *', async () => {
      try {
        const startTime = Date.now();
        const tokens = await aggregatorService.aggregateAllSources();
        const duration = Date.now() - startTime;
        
        console.log(`[WORKER] Aggregated ${tokens.length} tokens in ${duration}ms`);

        // Check for "Volatile" tokens to broadcast as immediate updates
        const updates = tokens
          .filter(t => Math.abs(t.price_1hr_change) > 5) // Broadcasr big moves
          .slice(0, 10)
          .map(t => ({
            token_address: t.token_address,
            price_usd: t.price_usd,
            price_sol: t.price_sol,
            last_updated: Date.now()
          }));

        if (updates.length > 0) {
          await redisService.broadcastUpdates(updates);
        }

      } catch (error) {
        console.error('[WORKER] Aggregation job failed:', error);
      }
    });
  }
}

AggregatorWorker.start();
