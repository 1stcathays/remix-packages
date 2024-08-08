import { createSessionStorage, type SessionIdStorageStrategy } from '@remix-run/node';
import type { CacheClient } from '@1stcathays/remix-cache';
import initSession from './index';

vi.mock('@remix-run/node');

describe('[pkg] Session', () => {
  let cache: CacheClient;
  let strategy: SessionIdStorageStrategy;

  beforeEach(() => {
    vi.useFakeTimers();

    cache = {
      del: vi.fn(),
      get: vi.fn(),
      getItem: vi.fn(),
      getItems: vi.fn(),
      set: vi.fn(),
      setItem: vi.fn(),
    };

    initSession(cache);

    const [[args]] = vi.mocked(createSessionStorage).mock.calls;
    strategy = args;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.resetAllMocks();
  });

  it('should create session data', async () => {
    const data = { one: 1 };
    const id = await strategy.createData(data);

    expect(id).toBeDefined();
    expect(cache.set).toHaveBeenCalledWith(`session:${id}`, JSON.stringify(data), undefined);
  });

  it('should delete session data', async () => {
    const id = '123';
    await strategy.deleteData(id);

    expect(cache.del).toHaveBeenCalledWith(`session:${id}`);
  });

  it('should read session data', async () => {
    const id = '321';
    const data = { key: 'value' };

    vi.mocked(cache).get.mockResolvedValue(JSON.stringify(data));

    expect(await strategy.readData(id)).toEqual(data);
  });

  it('should read missing session data', async () => {
    const id = '456';

    vi.mocked(cache).get.mockResolvedValue(null);

    expect(await strategy.readData(id)).toBeNull();
  });

  it('should update session data', async () => {
    const id = '654';
    const data = { key: 'new' };
    const expires = new Date(+new Date() + 120 * 1000);

    await strategy.updateData(id, data, expires);

    expect(cache.set).toHaveBeenCalledWith(`session:${id}`, JSON.stringify(data), 120);
  });
});
