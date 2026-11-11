import { buildFacets, filterEntries, toSummary } from '../filter';
import { entryFromRow } from '../rows';
import type { Catalog, Entry, EntryQuery } from '../types';
import type { Sql } from '../persist/sql';

const summaryLoads = new WeakMap<Sql, Promise<Entry[]>>();

const MIN_YEAR = 2023; // hide years before this in public-facing version

/** Catalog over the Postgres schema. SQLite keeps its own adapter. */
export function createSqlCatalog(sql: Sql): Catalog {
	return {
		async listEntries(query?: Partial<EntryQuery>) {
			const needsCredits = Boolean(query?.q?.trim() || query?.person?.trim());
			return filterEntries(await allEntries(sql, needsCredits), query).map(toSummary);
		},
		async getEntry(id: string) {
			const rows = await sql.query('SELECT * FROM entries WHERE id = $1', [id]);
			const row = rows[0];
			if (!row) return null;
			const images = await sql.query<{ url: string }>(
				'SELECT url FROM entry_images WHERE entry_id = $1 ORDER BY sort_order',
				[id]
			);
			const credits = await sql.query<{ name: string; role: string }>(
				'SELECT name, role FROM credits WHERE entry_id = $1 ORDER BY sort_order',
				[id]
			);
			const links = await sql.query<{ locator: string }>(
				`SELECT locator FROM source_assets
				 WHERE source_key = $1 AND kind = 'url' AND locator NOT LIKE '/media/%'
				 ORDER BY sort_order`,
				[row.source_key]
			);
			return entryFromRow(
				row,
				images.map((image) => image.url),
				credits.map((credit) => ({ name: credit.name, role: credit.role })),
				[...new Set(links.map((link) => link.locator))]
			);
		},
		async getFacets() {
			return buildFacets(await loadSummaries(sql));
		}
	};
}

/**
 * Card and facet reads share one pass. Image files and credits stay out of it:
 * the homepage was loading both tables in full, twice, before it could answer.
 */
function loadSummaries(sql: Sql) {
	let pending = summaryLoads.get(sql);
	if (!pending) {
		pending = readSummaries(sql).catch((error) => {
			summaryLoads.delete(sql);
			throw error;
		});
		summaryLoads.set(sql, pending);
	}
	return pending;
}

async function readSummaries(sql: Sql) {
	const rows = await sql.query('SELECT * FROM entries WHERE year >= $1', [MIN_YEAR]);
	const counts = await sql.query<{ entry_id: string; n: number }>(
		`SELECT i.entry_id, count(*)::int AS n
		 FROM entry_images i JOIN entries e ON e.id = i.entry_id
		 WHERE e.year >= $1
		 GROUP BY i.entry_id`,
		[MIN_YEAR]
	);
	const imageCount = new Map(counts.map((row) => [String(row.entry_id), Number(row.n)]));
	return rows.map((row) => {
		const count = imageCount.get(String(row.id)) ?? 0;
		const thumbnail = String(row.thumbnail ?? '');
		const images = count > 0 && thumbnail ? Array(count).fill(thumbnail) : [];
		return entryFromRow(row, images, []);
	});
}

async function allEntries(sql: Sql, withCredits: boolean) {
	if (!withCredits) return loadSummaries(sql);
	const entries = await loadSummaries(sql);
	const credits = await sql.query<{ entry_id: string; name: string; role: string }>(
		`SELECT c.entry_id, c.name, c.role
		 FROM credits c JOIN entries e ON e.id = c.entry_id
		 WHERE e.year >= $1
		 ORDER BY c.sort_order`,
		[MIN_YEAR]
	);
	const creditsById = group(
		credits,
		(credit) => credit.entry_id,
		(credit) => ({
			name: credit.name,
			role: credit.role
		})
	);
	return entries.map((entry) => ({
		...entry,
		credits: creditsById.get(entry.id) ?? []
	}));
}

function group<T, V>(rows: T[], key: (row: T) => string, value: (row: T) => V) {
	const grouped = new Map<string, V[]>();
	for (const row of rows) {
		const id = key(row);
		const list = grouped.get(id) ?? [];
		list.push(value(row));
		grouped.set(id, list);
	}
	return grouped;
}
