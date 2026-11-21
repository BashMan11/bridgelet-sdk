import { DataSource } from 'typeorm';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { buildTypeOrmCliOptions } from './typeorm-datasource.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * DataSource used by the TypeORM CLI (migration:run, migration:revert, …).
 *
 * Options (including the hard-disabled `synchronize` guard and pool sizing)
 * live in `buildTypeOrmCliOptions` so they can be unit-tested without loading
 * this ESM-only module.
 */
export default new DataSource(buildTypeOrmCliOptions(__dirname));
