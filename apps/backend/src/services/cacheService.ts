import Redis from 'ioredis';
import { config } from '../config';

class CacheService {
  private redisClient: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private isRedisConnected = false;

  constructor() {
    if (config.redisUrl) {
      try {
        this.redisClient = new Redis(config.redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });

        this.redisClient.connect().then(() => {
          this.isRedisConnected = true;
          console.log('✅ Redis Cache connected successfully.');
        }).catch(() => {
          console.log('⚠️ Redis not available. Falling back to high-speed In-Memory Cache.');
        });
      } catch (err) {
        console.log('⚠️ Redis initialization error. Using In-Memory Cache.');
      }
    }
  }

  // Normalizes query for high cache hit rates
  public normalizeKey(teacherId: string, query: string): string {
    const cleanQuery = query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ');
    return `ai_doubt:${teacherId}:${cleanQuery}`;
  }

  public async get(key: string): Promise<string | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        return await this.redisClient.get(key);
      } catch {
        // Fallback to memory
      }
    }

    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.value;
  }

  public async set(key: string, value: string, ttlSeconds = 86400): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback to memory
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

export const cacheService = new CacheService();
