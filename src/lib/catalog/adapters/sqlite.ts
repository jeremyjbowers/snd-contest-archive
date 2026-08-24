import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { buildFacets, filterEntries, toSummary } from '../filter';
import type { Catalog, Credit, Entry, EntryQuery } from '../types';

/**
 * Reads the same schema as `data/schema.sql`.
 *
 * Create a file with:
 *   sqlite3 data/archive.db < data/schema.sql
 * then load rows however you like. Until that file exists, the CSV adapter is
 * the working mock.
 */
export function createSqliteCatalog(relativePath: string): Catalog {
	const filePath = resolve(process.cwd(), relativePath);
	if (!existsSync(filePath)) {
		throw new Error(
			`SQLite catalog not found at ${filePath}. Create it from data/schema.sql or set CATALOG_URL=csv:data/entries.csv`
		);
	}

	const db = new DatabaseSync(filePath);

	function allEntries() {
		return (db.prepare(`SELECT * FROM entries`).all() as Record<string, unknown>[]).map((row) =>
			hydrate(db, row)
		);
	}

	return {
		async listEntries(query: Partial<EntryQuery> = {}) {
			return filterEntries(allEntries(), query).map(toSummary);
		},
		async getEntry(id: string) {
			const row = db.prepare(`SELECT * FROM entries WHERE id = ?`).get(id) as
				Record<string, unknown> | undefined;
			return row ? hydrate(db, row) : null;
		},
		async getFacets() {
			return buildFacets(allEntries());
		}
	};
}

function hydrate(db: DatabaseSync, row: Record<string, unknown>): Entry {
	const id = String(row.id);
	const images = db
		.prepare(`SELECT url FROM entry_images WHERE entry_id = ? ORDER BY sort_order`)
		.all(id) as Array<{ url: string }>;
	const credits = db
		.prepare(`SELECT name, role FROM credits WHERE entry_id = ? ORDER BY sort_order`)
		.all(id) as Credit[];

	return {
		id,
		title: String(row.title),
		publication: String(row.publication),
		year: Number(row.year),
		award: String(row.award),
		category: String(row.category),
		subcategory: row.subcategory ? String(row.subcategory) : null,
		discipline: String(row.discipline),
		platform: String(row.platform),
		topic: row.topic ? String(row.topic) : null,
		description: row.description ? String(row.description) : null,
		url: row.url ? String(row.url) : null,
		thumbnail: String(row.thumbnail),
		images: images.length ? images.map((image) => image.url) : [String(row.thumbnail)],
		credits,
		student: Boolean(row.student),
		nonEditorial: Boolean(row.non_editorial),
		multiWinner: Boolean(row.multi_winner),
		access: row.access === 'member' ? 'member' : 'public'
	};
}
