import type { Logger } from '@1stcathays/remix-logging';
import { createClient } from 'redis';
import { createRedisCacheClient, RedisCacheClient } from './redis-cache';

vi.mock('redis', () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    del: vi.fn(),
    get: vi.fn(),
    hGet: vi.fn(),
    hGetAll: vi.fn(),
    hSet: vi.fn(),
    on: vi.fn(),
    set: vi.fn(),
  };

  return {
    createClient: vi.fn().mockReturnValue(mockClient),
  };
});

describe('[module] Redis Cache', () => {
  const key = 'get';
  const field = 'field';
  const value = 'value';
  const expires = 7200;

  let cache: RedisCacheClient;
  let redisUrl: string;
  let logger: Logger;

  beforeEach(async () => {
    logger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn(),
    };

    redisUrl = 'redis://redis:6379';
    cache = await createRedisCacheClient(redisUrl, logger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create redis cache client', () => {
    expect(cache).toBeInstanceOf(RedisCacheClient);
    expect(createClient).toHaveBeenCalledWith({ url: redisUrl });
  });

  it('should get cache item', async () => {
    vi.mocked(cache.client).get.mockResolvedValue(value);

    expect(await cache.get(key)).toBe(value);
    expect(cache.client.get).toHaveBeenCalledWith(key);
  });

  it('should get cache item entry', async () => {
    vi.mocked(cache.client).hGet.mockResolvedValue(value);

    expect(await cache.getItem(key, field)).toBe(value);
    expect(cache.client.hGet).toHaveBeenCalledWith(key, field);
  });

  it('should get cache items', async () => {
    const allItems = { [field]: value };
    vi.mocked(cache.client).hGetAll.mockResolvedValue(allItems);

    expect(await cache.getItems(key)).toBe(allItems);
    expect(cache.client.hGetAll).toHaveBeenCalledWith(key);
  });

  it('should set cache item', async () => {
    await cache.set(key, value);
    expect(cache.client.set).toHaveBeenCalledWith(key, value, {});
  });

  it('should set cache item entry', async () => {
    await cache.setItem(key, field, value);
    expect(cache.client.hSet).toHaveBeenCalledWith(key, field, value);
  });

  it('should set cache item with expiry', async () => {
    await cache.set(key, value, expires);
    expect(cache.client.set).toHaveBeenCalledWith(key, value, { EX: expires });
  });

  it('should delete cache item', async () => {
    await cache.del(key);
    expect(cache.client.del).toHaveBeenCalledWith(key);
  });
});
