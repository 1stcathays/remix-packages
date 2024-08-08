import { readFile, stat, writeFile } from 'fs/promises';
import type { Logger } from '@1stcathays/remix-logging';
import type { CacheClient } from './cache-client';

export type CacheEntry = {
  /**
   * Value to be cached
   */
  value: string;

  /**
   * Timestamp for when this value expires
   */
  expires: number | undefined;
};

async function loadCacheData(filePath: string, logger?: Logger): Promise<Map<string, CacheEntry>> {
  try {
    const fileInfo = await stat(filePath);

    if (fileInfo.isFile()) {
      const data = await readFile(filePath, 'utf8');
      return new Map(JSON.parse(data));
    }
  } catch (err) {
    logger?.error({ err, filePath }, 'Failed to load cache data');
  }

  return new Map();
}

async function writeCacheData(filePath: string, cacheData: Map<string, CacheEntry>, logger?: Logger) {
  try {
    await writeFile(filePath, JSON.stringify(Array.from(cacheData.entries()), null, 2), 'utf8');
  } catch (ex) {
    logger?.error({ ex, filePath }, 'Failed to write cache data');
  }
}

export class FileCacheClient implements CacheClient {
  constructor(
    private readonly filePath: string,
    private readonly cacheData: Map<string, CacheEntry> = new Map(),
    private readonly logger?: Logger,
  ) {
    this.filePath = filePath;
    this.cacheData = cacheData;
    this.logger = logger;
  }

  async del(key: string): Promise<void> {
    if (!this.cacheData.has(key)) return;

    this.cacheData.delete(key);
    await writeCacheData(this.filePath, this.cacheData, this.logger);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cacheData.get(key);

    if (entry?.value === undefined) return null;

    if (entry?.expires && Date.now() > entry.expires) {
      await this.del(key);
      return null;
    }

    return entry.value;
  }

  async getItem(key: string, field: string): Promise<string | undefined> {
    try {
      const strData = await this.get(key);

      if (!strData) return;

      const hash = JSON.parse(strData);
      return hash[field];
    } catch (err) {
      this.logger?.error({ err, field, key }, 'Failed to load cache item');
    }
  }

  async getItems(key: string): Promise<{ [key: string]: string } | undefined> {
    try {
      const strData = await this.get(key);

      if (!strData) return;

      return JSON.parse(strData);
    } catch (err) {
      this.logger?.error({ err, key }, 'Failed to load cache items');
    }
  }

  async set(key: string, value: string, expires?: number): Promise<void> {
    let expiresTime;

    if (expires && Number.isInteger(expires)) {
      expiresTime = Date.now() + expires * 1000;
    }

    this.cacheData.set(key, {
      expires: expiresTime,
      value,
    });

    await writeCacheData(this.filePath, this.cacheData, this.logger);
  }

  async setItem(key: string, field: string, value: string): Promise<void> {
    let items = await this.getItems(key);

    if (items) {
      items[field] = value;
    } else {
      items = { [field]: value };
    }

    return this.set(key, JSON.stringify(items));
  }
}

/**
 *
 * @param {string} filePath - Absolute path to the file to store cache data
 * @param {Logger} logger - logger to log errors
 * @returns {FileCacheClient} - the file cache client
 */
export async function createFileCacheClient(filePath: string, logger?: Logger) {
  const cacheData = await loadCacheData(filePath, logger);
  return new FileCacheClient(filePath, cacheData, logger);
}
