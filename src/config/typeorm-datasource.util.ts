import { DataSourceOptions } from 'typeorm';

/**
 * #1045: `synchronize: true` auto-alters the schema from entities and must
 * never run against a migration-driven database. This is intentionally a
 * hard-coded constant (not derived from NODE_ENV or DATABASE_SYNC) so the
 * TypeORM CLI DataSource can never sync the schema; migrations own all
 * schema changes.
 */
export const TYPEORM_CLI_SYNCHRONIZE = false as const;

/**
 * Builds the options for the DataSource used by the TypeORM CLI
 * (migration:run, migration:revert, …).
 *
 * Kept separate from `typeorm.config.ts` (which uses `import.meta.url`) so
 * Jest can exercise it directly, including the `synchronize` guard.
 *
 * Pool rationale (issue #516)
 * ────────────────────────────
 * • max: 10 – Caps the per-instance pool to a value that leaves headroom for
 *             other services sharing the same PostgreSQL server. See
 *             docs/deployment.md for how to size this against expected
 *             concurrent load and multiple app instances.
 * • min: 2  – node-postgres's `min` does NOT eagerly open connections at
 *             startup; it only stops the pool from closing idle connections
 *             below this floor once they exist (see `_isAboveMin` in
 *             pg-pool). It does not remove first-request connection latency
 *             on its own.
 * • connectionTimeoutMillis: 3000 – This is the real node-postgres option
 *             (previously misspelled here as `acquireTimeoutMillis`, which
 *             pg-pool silently ignores). It governs BOTH the time allowed to
 *             establish a brand-new physical connection AND, critically,
 *             how long a caller queues for an already-open connection when
 *             the pool is fully saturated. Without it set, pool exhaustion
 *             queues callers indefinitely with no error – a silent hang
 *             rather than clear backpressure. With it set, a caller that
 *             can't get a connection within 3s fails fast with
 *             "timeout exceeded when trying to connect" instead of hanging.
 */
export function buildTypeOrmCliOptions(
  configDir: string,
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DATABASE_HOST || 'localhost',
    port: parseInt(env.DATABASE_PORT ?? '5432', 10),
    username: env.DATABASE_USER || 'bridgelet_user',
    password: env.DATABASE_PASSWORD || 'bridgelet_pass',
    database: env.DATABASE_NAME || 'bridgelet',
    entities: [configDir + '/../**/*.entity{.ts,.js}'],
    migrations: [configDir + '/../database/migrations/*{.ts,.js}'],
    migrationsTransactionMode: 'each',
    synchronize: TYPEORM_CLI_SYNCHRONIZE,
    poolSize: 10,
    extra: {
      min: 2,
      max: 10,
      connectionTimeoutMillis: 3000,
    },
  };
}
