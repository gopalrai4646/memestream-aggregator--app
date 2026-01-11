
import Redis from 'ioredis';
import { TokenData } from '../../types';

class RedisService {
  private client: Redis;
  private pubSub: Redis;
  private isConnected: boolean = false;
  private readonly INDEX_KEY = 'aggregated:tokens:solana';
  private readonly UPDATE_CHANNEL = 'tokens:updates';

  constructor() {
    // Support both Upstash Redis (REDIS_URL) and traditional Redis (host/port)
    const redisUrl = process.env.REDIS_URL;
    const redisOptions = redisUrl 
      ? { 
          url: redisUrl,
          // Upstash Redis requires TLS
          tls: redisUrl.includes('upstash.io') ? {} : undefined
        }
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined
        };

    this.client = new Redis(redisOptions);
    this.pubSub = new Redis(redisOptions);

    // Handle connection errors gracefully
    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('[Redis] Connected successfully');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      console.warn('[Redis] Connection error (continuing without Redis):', error.message);
    });

    this.pubSub.on('connect', () => {
      console.log('[Redis] Pub/Sub connected successfully');
    });

    this.pubSub.on('error', (error) => {
      console.warn('[Redis] Pub/Sub connection error:', error.message);
    });
  }

  async saveIndex(tokens: TokenData[]) {
    if (!this.isConnected) {
      console.warn('[Redis] Not connected, skipping saveIndex');
      return;
    }
    try {
      // Set with expiration (TTL) to ensure data freshness
      await this.client.set(this.INDEX_KEY, JSON.stringify(tokens), 'EX', 60);
    } catch (error) {
      console.warn('[Redis] Error saving index:', error);
    }
  }

  async getIndex(): Promise<TokenData[]> {
    if (!this.isConnected) {
      console.warn('[Redis] Not connected, returning empty array');
      return [];
    }
    try {
      const data = await this.client.get(this.INDEX_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('[Redis] Error getting index:', error);
      return [];
    }
  }

  /**
   * Publishes partial updates for WebSocket clients
   */
  async broadcastUpdates(updates: Partial<TokenData>[]) {
    if (!this.isConnected) {
      console.warn('[Redis] Not connected, skipping broadcast');
      return;
    }
    try {
      await this.client.publish(this.UPDATE_CHANNEL, JSON.stringify(updates));
    } catch (error) {
      console.warn('[Redis] Error broadcasting updates:', error);
    }
  }

  /**
   * Subscription wrapper for the WebSocket server
   */
  subscribeToUpdates(callback: (updates: Partial<TokenData>[]) => void) {
    if (!this.isConnected) {
      console.warn('[Redis] Not connected, WebSocket updates will not work');
      return () => {}; // Return no-op unsubscribe function
    }
    try {
      this.pubSub.subscribe(this.UPDATE_CHANNEL);
      this.pubSub.on('message', (channel, message) => {
        if (channel === this.UPDATE_CHANNEL) {
          try {
            callback(JSON.parse(message));
          } catch (error) {
            console.warn('[Redis] Error parsing message:', error);
          }
        }
      });
      
      return () => {
        try {
          this.pubSub.unsubscribe(this.UPDATE_CHANNEL);
        } catch (error) {
          console.warn('[Redis] Error unsubscribing:', error);
        }
      };
    } catch (error) {
      console.warn('[Redis] Error subscribing to updates:', error);
      return () => {}; // Return no-op unsubscribe function
    }
  }
}

export const redisService = new RedisService();
