import config from './env-config';

describe('[pkg] Config', () => {
  beforeEach(() => {
    process.env.CONFIG_ITEM = 'item';
    process.env.CONFIG_LIST = 'item one, item two';
    process.env.CONFIG_LIST_PIPE = 'item one|item two|item three';
  });

  afterEach(() => {
    delete process.env.CONFIG_ITEM;
    delete process.env.CONFIG_LIST;
    delete process.env.CONFIG_LIST_PIPE;
  });

  it('should throw error for unknown config item', () => {
    expect(() => config.get('unknown')).toThrowError();
  });

  it('should get default for an unknown key', () => {
    const value = 'default value';
    expect(config.get('defaulted', value)).toBe(value);
  });

  it('should get default value as empty value', () => {
    const value = '';
    expect(config.get('defaulted', value)).toBe(value);
  });

  it('should get config item', () => {
    expect(config.get('CONFIG_ITEM')).toBe('item');
  });

  it('should get config list', () => {
    expect(config.list('CONFIG_LIST')).toEqual(['item one', 'item two']);
  });

  it('should get config list with delimiter', () => {
    expect(config.list('CONFIG_LIST_PIPE', '|')).toEqual(['item one', 'item two', 'item three']);
  });

  it('should return true when config has item', () => {
    expect(config.has('CONFIG_ITEM')).toBeTruthy();
  });

  it("should return false when config doesn't has item", () => {
    expect(config.has('UNKNOWN')).toBeFalsy();
  });
});
