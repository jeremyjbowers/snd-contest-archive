import type { Catalog } from '../types';

/**
 * Placeholder for a future Postgres-backed catalog.
 *
 * When you stand up the real database, implement this with `postgres` or
 * Drizzle using `data/schema.sql` as the starting point. Pages should keep
 * calling `getCatalog()` and never import this file directly.
 */
export function createPostgresCatalog(url: string): Catalog {
	void url;
	const message =
		'Postgres is not wired yet. Keep CATALOG_URL=csv:data/entries.csv (or sqlite:data/archive.db) until the backend is ready.';

	return {
		async listEntries() {
			throw new Error(message);
		},
		async getEntry() {
			throw new Error(message);
		},
		async getFacets() {
			throw new Error(message);
		}
	};
}
