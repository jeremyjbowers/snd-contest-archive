import { pgSql } from '../persist/pg';
import { createSqlCatalog } from './sql-catalog';
import type { Catalog } from '../types';

/**
 * Postgres-backed catalog. Apply `data/postgres.sql` (the loader does this)
 * and point CATALOG_URL at a `postgres://` or `postgresql://` URL.
 */
export function createPostgresCatalog(url: string): Catalog {
	return createSqlCatalog(pgSql(url));
}
