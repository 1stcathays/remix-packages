export type CacheClient = {
  /**
   * Retrieve an item from the cache at key
   * @param {string} key - the key of the item
   * @returns {Promise<string | null>} the value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Returns single field from stored hash at key
   * @param {string} key - the key of the field
   * @returns {Promise<string | undefined>} the field or undefined if not found
   */
  getItem(key: string, field: string): Promise<string | undefined>;

  /**
   * Returns all fields from stored hash at key
   * @param {string} key - the key of the fields
   * @returns {Promise<{ [key: string]: string } | undefined>} the fields stored or undefined if key doesn't exist in the store
   */
  getItems(key: string): Promise<{ [key: string]: string } | undefined>;

  /**
   * Set an item at key with optional expiry in seconds
   * @param {string} key - the key of the item
   * @param {string} value - the value of the item
   * @param {number} expires - when to set as expired (seconds)
   */
  set(key: string, value: string, expires?: number): Promise<void>;

  /**
   * Set a field in stored hash at key
   * @param {string} key - the key of the item
   * @param {string} value - the value of the item
   */
  setItem(key: string, field: string, value: string): Promise<void>;

  /**
   * Delete an item at key
   * @param key - the key of the value
   */
  del(key: string): Promise<void>;
};
