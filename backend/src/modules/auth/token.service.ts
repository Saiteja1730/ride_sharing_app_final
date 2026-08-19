import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config';
import { redisService } from '../../infrastructure/redis/redis.service';


export interface TokenPayload {
  userId: string;
  role: string;
  tenantId?: string;
}

export class TokenService {
  public generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: '15m', // Short-lived access token
    });
  }

  public generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  public async storeRefreshToken(userId: string, refreshToken: string, ttlSeconds: number = 7 * 24 * 3600): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const key = `refresh:${tokenHash}`;
    const client = redisService.getRawClient();
    if (client.status === 'ready') {
      await client.sadd(`user:${userId}:refresh_tokens`, key).catch(() => {});
    }
    await redisService.setex(key, ttlSeconds, JSON.stringify({ userId, createdAt: new Date().toISOString() }));
  }

  public async verifyRefreshToken(refreshToken: string): Promise<{userId: string} | null> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const key = `refresh:${tokenHash}`;
    const stored = await redisService.get(key);
    return stored ? JSON.parse(stored) : null;
  }

  public async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const key = `refresh:${tokenHash}`;
    const stored = await redisService.get(key);
    if (stored) {
       const { userId } = JSON.parse(stored);
       const client = redisService.getRawClient();
       if (client.status === 'ready') {
         await client.srem(`user:${userId}:refresh_tokens`, key).catch(() => {});
       }
       await redisService.del(key);
    }
  }

  public async consumeRefreshToken(refreshToken: string): Promise<{userId: string} | null> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const key = `refresh:${tokenHash}`;
    
    // Check if it's in the consumed list (reuse detection)
    const isConsumed = await redisService.get(`consumed:${key}`);
    if (isConsumed) {
       const { userId } = JSON.parse(isConsumed);
       await this.revokeAllUserSessions(userId); // Reuse detected, revoke all!
       return null;
    }

    const stored = await redisService.get(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Mark as consumed for 1 minute (grace period for network issues)
    await redisService.setex(`consumed:${key}`, 60, stored);
    
    // Revoke the old token
    await this.revokeRefreshToken(refreshToken);

    return parsed;
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    const client = redisService.getRawClient();
    if (client.status === 'ready') {
      const keys = await client.smembers(`user:${userId}:refresh_tokens`);
      if (keys.length > 0) {
        await redisService.del(...keys);
        await redisService.del(`user:${userId}:refresh_tokens`);
      }
    }
  }

  public verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  }
}

export const tokenService = new TokenService();
