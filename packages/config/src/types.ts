export type Config = {
  /**
   * Get value of item at key with optional default value if not present
   * @throws {Error} If item is not present and no default is provided.
   * @param {string} key - key of value to get
   * @param {string} defaultValue - fallback when key doesn't exist
   * @returns {string} value of item
   */
  get(key: string, defaultValue?: string): string;

  /**
   * Returns true if item exists at key
   * @param {string} key - key to check
   * @requires {boolean} true if key exists
   */
  has(key: string): boolean;

  /**
   * Return list of items stored at key
   * @throws {Error} if item is not present
   * @param {string} key - key of values to get
   * @param {string | RegExp} delimiter - used to split the value into token. Defaults to comma separation.
   */
  list(key: string, delimiter?: string | RegExp): string[];
};
