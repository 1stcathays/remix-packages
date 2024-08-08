import type { Logger } from '@1stcathays/remix-logging';
import { lazyInit } from '@1stcathays/remix-utils';
import type { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';
import { createClient } from 'redis';
import type { CacheClient } from './cache-client';

const getClient = lazyInit(async (url: string, logger?: Logger) => {
  const client = createClient({ url });

  if (logger) {
    client.on('error', (err: Error) => logger.error({ err }, 'Redis Client Error'));
  }

  await client.connect();

  return client;
});

type SetOptions = { EX?: number };

function getExpiresOption(expires?: number): SetOptions {
  const opts: SetOptions = {};

  if (Number.isInteger(expires)) {
    opts.EX = expires;
  }

  return opts;
}

export class RedisCacheClient implements CacheClient {
  constructor(public readonly client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>) {
    this.client = client;
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  getItem(key: string, field: string): Promise<string | undefined> {
    return this.client.hGet(key, field);
  }

  getItems(key: string): Promise<{ [key: string]: string } | undefined> {
    return this.client.hGetAll(key);
  }

  async set(key: string, value: string, expires?: number): Promise<void> {
    await this.client.set(key, value, getExpiresOption(expires));
  }

  async setItem(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value);
  }

  async del(key: string): Promise<void> {
    this.client.del(key);
  }
}

/**
 * Creates a Redis cache client
 * @param {string} url - Redis server URL (e.g. redis://localhost:6379)
 * @param {Logger} logger - for logging
 * @returns {RedisCacheClient} - the Redis cache client
 */
export async function createRedisCacheClient(url: string, logger?: Logger): Promise<RedisCacheClient> {
  return new RedisCacheClient(await getClient(url, logger));
}
