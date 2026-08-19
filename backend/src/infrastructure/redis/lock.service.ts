import crypto from 'crypto';
import { redisService } from './redis.service';
import { logger } from '../../utils/logger';


export class DistributedLockService {
  private fallbackLocks = new Map<string, { value: string; expiry: number }>();

  public async acquireLock(
    resourceKey: string,
    ttlMs: number = 5000
  ): Promise<string | null> {
    const client = redisService.getRawClient();
    if (client.status !== 'ready') {
      const now = Date.now();
      const existing = this.fallbackLocks.get(resourceKey);
      if (existing && existing.expiry > now) {
        return null;
      }
      const lockValue = crypto.randomBytes(16).toString('hex');
      this.fallbackLocks.set(resourceKey, { value: lockValue, expiry: now + ttlMs });
      return lockValue;
    }
    const lockValue = crypto.randomBytes(16).toString('hex');
    const lockKey = `lock:${resourceKey}`;

    const result = await client.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
    if (result === 'OK') return lockValue;
    return null;
  }

  public async releaseLock(resourceKey: string, lockValue: string): Promise<boolean> {
    const client = redisService.getRawClient();
    if (client.status !== 'ready') {
      const existing = this.fallbackLocks.get(resourceKey);
      if (existing && existing.value === lockValue) {
        this.fallbackLocks.delete(resourceKey);
        return true;
      }
      return false;
    }
    const lockKey = `lock:${resourceKey}`;

    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await client.eval(luaScript, 1, lockKey, lockValue);
    return result === 1;
  }

}

export const distributedLockService = new DistributedLockService();
