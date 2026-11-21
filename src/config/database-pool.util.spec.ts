import { LOAD_TEST_CONCURRENCY, POOL_CONFIG } from './database-pool.util.js';

/**
 * #1046: lock the pool-sizing contract against the documented
 * 50-concurrent `POST /accounts` load profile and Postgres's default
 * `max_connections`, so a future tweak cannot silently invalidate the
 * README guidance.
 */
describe('database connection pool sizing (#1046)', () => {
  const POSTGRES_DEFAULT_MAX_CONNECTIONS = 100;
  const OTHER_SERVICE_CONNECTIONS = 10;

  it('keeps the documented per-instance pool and fail-fast timeout', () => {
    expect(POOL_CONFIG).toEqual({
      min: 2,
      max: 10,
      connectionTimeoutMillis: 3000,
    });
  });

  it('serves the 50-request burst by queueing rather than opening 50 connections', () => {
    expect(LOAD_TEST_CONCURRENCY).toBe(50);
    expect(POOL_CONFIG.max).toBeLessThan(LOAD_TEST_CONCURRENCY);
    expect(POOL_CONFIG.connectionTimeoutMillis).toBeGreaterThan(0);
  });

  it.each([2, 4])(
    'keeps %i app instances under default max_connections with one CLI pool and other services',
    (appInstances) => {
      const totalConnections =
        (appInstances + 1) * POOL_CONFIG.max + OTHER_SERVICE_CONNECTIONS;

      expect(totalConnections).toBeLessThan(POSTGRES_DEFAULT_MAX_CONNECTIONS);
    },
  );

  it('supports up to 7 app instances before the documented budget is exhausted', () => {
    const budget = (appInstances: number): number =>
      (appInstances + 1) * POOL_CONFIG.max + OTHER_SERVICE_CONNECTIONS;

    expect(budget(7)).toBe(90);
    expect(budget(8)).toBe(100);
    expect(budget(7)).toBeLessThan(POSTGRES_DEFAULT_MAX_CONNECTIONS);
  });
});
