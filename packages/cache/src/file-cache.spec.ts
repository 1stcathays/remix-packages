import type { Stats } from 'fs';
import { readFile, stat, writeFile } from 'fs/promises';
import { createFileCacheClient, FileCacheClient } from './file-cache';

vi.mock('fs/promises');

describe('[module] FileCache', () => {
  const cacheData = { expires: undefined, value: JSON.stringify({ field: 'value' }) };
  const cacheKey = 'test:1';
  const filePath = '/path/to/cache.json';

  beforeEach(() => {
    vi.useFakeTimers();

    process.env.APP_CACHE_FILE = filePath;
  });

  afterEach(() => {
    delete process.env.APP_CACHE_FILE;

    vi.resetAllMocks();
    vi.useRealTimers();
  });

  describe('[feat] create cache', () => {
    describe('[scenario] Cache file exists', () => {
      beforeEach(() => {
        vi.mocked(stat).mockResolvedValue({ isFile: () => true } as Stats);
        vi.mocked(readFile).mockResolvedValue(JSON.stringify([[cacheKey, cacheData]]));
      });

      it('should create cache', async () => {
        const cache = await createFileCacheClient(filePath);
        expect(cache).toBeDefined();
      });

      it('should return cache entry', async () => {
        const cache = await createFileCacheClient(filePath);
        expect(await cache.get(cacheKey)).toEqual(cacheData.value);
      });
    });

    describe('[scenario] Cache file is not found', () => {
      beforeEach(() => {
        vi.mocked(stat).mockRejectedValue({ message: 'file not found' });
      });

      it('should create file cache', async () => {
        const cache = await createFileCacheClient(filePath);
        expect(cache).toBeDefined();
      });
    });

    describe('[scenario] Cache file is not a file', () => {
      beforeEach(() => {
        vi.mocked(stat).mockResolvedValue({ isFile: () => false } as Stats);
      });

      it('should create file cache', async () => {
        const cache = await createFileCacheClient(filePath);
        expect(cache).toBeDefined();
      });
    });
  });

  describe('[module] FileCacheClient', () => {
    let cacheClient: FileCacheClient;

    beforeEach(() => {
      cacheClient = new FileCacheClient(filePath, new Map([[cacheKey, cacheData]]));
    });

    describe('[fn] get', () => {
      it('should return cache item', async () => {
        expect(await cacheClient.get(cacheKey)).toEqual(cacheData.value);
      });

      it('should return null for unknown item', async () => {
        expect(await cacheClient.get('unknown')).toBeNull();
      });

      it('should return null for expired item', async () => {
        const expires = 30;
        const key = 'expired';

        await cacheClient.set(key, 'some value', expires);
        expect(await cacheClient.get(key)).not.toBeNull();

        vi.advanceTimersByTime(expires * 1000 + 1);
        expect(await cacheClient.get(key)).toBeNull();
      });
    });

    describe('[fn] getItem', () => {
      it('should return field value', async () => {
        expect(await cacheClient.getItem(cacheKey, 'field')).toEqual('value');
      });

      it('should return undefined for unknown field', async () => {
        expect(await cacheClient.getItem(cacheKey, 'unknown')).toBeUndefined();
      });

      it('should return undefined for unknown key', async () => {
        expect(await cacheClient.getItem('unknown', 'field')).toBeUndefined();
      });
    });

    describe('[fn] getItems', () => {
      it('should return all items at key', async () => {
        expect(await cacheClient.getItems(cacheKey)).toEqual({ field: 'value' });
      });

      it('should return undefined for unknown key', async () => {
        expect(await cacheClient.getItems('unknown')).toBeUndefined();
      });
    });

    describe('[fn] set', () => {
      const key = 'new item';
      const value = 'new value';

      it('should set item', async () => {
        await cacheClient.set(key, value);

        expect(writeFile).toHaveBeenCalledWith(
          filePath,
          JSON.stringify(
            [
              [cacheKey, cacheData],
              [key, { expires: undefined, value }],
            ],
            null,
            2,
          ),
          'utf8',
        );
      });

      it('should set item with expiry', async () => {
        const expires = 10;

        await cacheClient.set(key, value, expires);

        expect(writeFile).toHaveBeenCalledWith(
          filePath,
          JSON.stringify(
            [
              [cacheKey, cacheData],
              [key, { expires: Date.now() + expires * 1000, value }],
            ],
            null,
            2,
          ),
          'utf8',
        );
      });
    });

    describe('[fn] setItem', () => {
      it('should set item at key', async () => {
        const value = 'newValue';
        await cacheClient.setItem(cacheKey, 'field', value);

        expect(writeFile).toHaveBeenCalledWith(
          filePath,
          JSON.stringify([[cacheKey, { ...cacheData, value: JSON.stringify({ field: value }) }]], null, 2),
          'utf8',
        );
      });

      it('should create entry for unknown key', async () => {
        const newKey = 'new';
        const value = 'newValue';
        await cacheClient.setItem(newKey, 'field', value);

        expect(writeFile).toHaveBeenCalledWith(
          filePath,
          JSON.stringify(
            [
              [cacheKey, cacheData],
              [newKey, { expires: undefined, value: JSON.stringify({ field: value }) }],
            ],
            null,
            2,
          ),
          'utf8',
        );
      });
    });

    describe('[fn] del', () => {
      it('should delete item', async () => {
        await cacheClient.del(cacheKey);
        expect(writeFile).toHaveBeenCalledWith(filePath, JSON.stringify([], null, 2), 'utf8');
      });

      it('should ignore unknown item', async () => {
        await cacheClient.del('unknown');
        expect(writeFile).not.toHaveBeenCalled();
      });

      it('should handle write cache error', async () => {
        vi.mocked(writeFile).mockRejectedValue({ message: 'permission denied' });

        await cacheClient.del(cacheKey);

        expect(writeFile).toHaveBeenCalled();
        expect(await cacheClient.get(cacheKey)).toBeNull();
      });
    });
  });
});
