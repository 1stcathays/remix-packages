import * as crypto from 'crypto';
import {
  type CookieOptions,
  createCookie,
  createSessionStorage as createRemixSessionStorage,
  type SessionIdStorageStrategy,
} from '@remix-run/node';
import type { CacheClient } from '@1stcathays/remix-cache';

function getExpirySeconds(expires?: Date): number | undefined {
  return expires ? Math.ceil((expires.valueOf() - Date.now()) / 1000) : expires;
}

function cacheKey(id: string): string {
  return `session:${id}`;
}

function createStrategy(cache: CacheClient): SessionIdStorageStrategy {
  return {
    async createData(data, expires) {
      const randomBytes = crypto.randomBytes(8);
      const id = Buffer.from(randomBytes).toString('hex');
      await cache.set(cacheKey(id), JSON.stringify(data), getExpirySeconds(expires));

      return id;
    },

    async deleteData(id) {
      await cache.del(cacheKey(id));
    },

    async readData(id) {
      const data = await cache.get(cacheKey(id));
      return data ? JSON.parse(data) : null;
    },

    async updateData(id, data, expires) {
      await cache.set(cacheKey(id), JSON.stringify(data), getExpirySeconds(expires));
    },
  };
}

export function createSessionStorage(cache: CacheClient, cookieOptions?: CookieOptions) {
  const cookie = createCookie('__session', {
    httpOnly: true,
    maxAge: 28800,
    path: '/',
    sameSite: 'lax',
    secure: true,
    ...cookieOptions,
  });

  return createRemixSessionStorage({ ...createStrategy(cache), cookie });
}

export default createSessionStorage;
