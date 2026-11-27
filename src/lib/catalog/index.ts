import { env } from '$env/dynamic/private';
import { archiveOpen } from '$lib/auth/access';
import { createCsvCatalog } from './adapters/csv';
import { createPostgresCatalog } from './adapters/postgres';
import { createSqliteCatalog } from './adapters/sqlite';
import type { Catalog, Facets } from './types';

const CLOSED_FACETS: Facets = {
	disciplines: [],
	awards: [],
	platforms: [],
	organizations: [],
	topics: [],
	categories: [],
	yearMin: 0,
	yearMax: 0
};

/** Used while a request is signed out, so it cannot read or fill the homepage cache. */
const CLOSED: Catalog = {
	async listEntries() {
		return [];
	},
	async getEntry() {
		return null;
	},
	async getFacets() {
		return CLOSED_FACETS;
	}
};

/**
 * Pick a catalog adapter from CATALOG_URL.
 *
 *   csv:data/entries.csv          (default mock)
 *   sqlite:data/archive.db
 *   postgres://user:pass@host/db
 *   postgresql://user:pass@host/db
 */
export function getCatalog(): Catalog {
	if (!archiveOpen()) return CLOSED;
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
