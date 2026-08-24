import { env } from '$env/dynamic/private';
import { createCsvCatalog } from './adapters/csv';
import { createPostgresCatalog } from './adapters/postgres';
import { createSqliteCatalog } from './adapters/sqlite';
import type { Catalog } from './types';

/**
 * Pick a catalog adapter from CATALOG_URL.
 *
 *   csv:data/entries.csv          (default mock)
 *   sqlite:data/archive.db
 *   postgres://user:pass@host/db
 *   postgresql://user:pass@host/db
 */
export function getCatalog(): Catalog {
	const url = env.CATALOG_URL ?? 'csv:data/entries.csv';

	if (url.startsWith('csv:')) {
		return createCsvCatalog(url.slice('csv:'.length));
	}
	if (url.startsWith('sqlite:')) {
		return createSqliteCatalog(url.slice('sqlite:'.length));
	}
	if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
		return createPostgresCatalog(url);
	}

	throw new Error(
		`Unknown CATALOG_URL "${url}". Use csv:path, sqlite:path, or a postgres:// connection string.`
	);
}

export type { Catalog, Entry, EntryQuery, EntrySummary, Facets } from './types';
