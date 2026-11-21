import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  TYPEORM_CLI_SYNCHRONIZE,
  buildTypeOrmCliOptions,
} from './typeorm-datasource.util.js';

/**
 * #1045: the TypeORM CLI DataSource is migration-driven. `synchronize` must
 * stay hard-disabled so a stray NODE_ENV=test / DATABASE_SYNC=true (or a
 * developer toggling it in a hurry) can never auto-alter a real schema.
 */
describe('TypeORM CLI DataSource synchronize guard (#1045)', () => {
  const configDir = join(__dirname);

  it('exposes synchronize as the constant false', () => {
    expect(TYPEORM_CLI_SYNCHRONIZE).toBe(false);
  });

  it.each(['production', 'development', 'staging', 'test', undefined])(
    'is false when NODE_ENV=%s even with DATABASE_SYNC=true',
    (nodeEnv) => {
      const env: NodeJS.ProcessEnv = { DATABASE_SYNC: 'true' };
      if (nodeEnv !== undefined) {
        env.NODE_ENV = nodeEnv;
      }

      expect(buildTypeOrmCliOptions(configDir, env).synchronize).toBe(false);
    },
  );

  it('is false on a constructed DataSource under NODE_ENV=test', () => {
    const dataSource = new DataSource(
      buildTypeOrmCliOptions(configDir, {
        NODE_ENV: 'test',
        DATABASE_SYNC: 'true',
      }),
    );

    expect(dataSource.options.synchronize).toBe(false);
  });

  it('is wired into typeorm.config.ts via the guarded builder', () => {
    const source = readFileSync(join(configDir, 'typeorm.config.ts'), 'utf8');

    expect(source).toContain('buildTypeOrmCliOptions(__dirname)');
    expect(source).not.toMatch(/synchronize\s*:\s*true/);
  });
});
