import type { Config } from './types';

function getOrDefault(key: string, defaultValue?: string): string {
  if (!(key in process.env)) {
    if (defaultValue === undefined) {
      throw new Error(`Configuration item ${key} not found`);
    }

    return defaultValue;
  }

  return process.env[key] as string;
}

export const config: Config = {
  get(key: string, defaultValue?: string): string {
    return getOrDefault(key, defaultValue);
  },

  has(key: string): boolean {
    return !!getOrDefault(key, '');
  },

  list(key: string, delimiter = /\s*,\s*/): string[] {
    const items = getOrDefault(key);

    return items.split(delimiter).map((i) => i.trim());
  },
};

export default config;
