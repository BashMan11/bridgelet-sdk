/**
 * #1046: single source of truth for the running app's Postgres pool sizing.
 *
 * The documented load profile is a 50-concurrent-request account-creation
 * burst against one instance. `max` is intentionally smaller than that: the
 * pool queues excess requests briefly instead of opening 50 physical
 * connections, and `connectionTimeoutMillis` turns a saturated pool into a
 * fail-fast error rather than a silent hang. Keep these values and the
 * README load-testing section in sync.
 */
export const LOAD_TEST_CONCURRENCY = 50;

export const POOL_CONFIG = {
  min: 2,
  max: 10,
  connectionTimeoutMillis: 3000,
} as const;
