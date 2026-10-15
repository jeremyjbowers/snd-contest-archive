import { buildFacets, filterEntries, toSummary } from '../filter';
import { entryFromRow } from '../rows';
import type { Catalog, Entry, EntryQuery } from '../types';
import type { Sql } from '../persist/sql';

const summaryLoads = new WeakMap<Sql, Promise<Entry[]>>();

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
			return entryFromRow(
				row,
				images.map((image) => image.url),
				credits.map((credit) => ({ name: credit.name, role: credit.role }))
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
	const rows = await sql.query('SELECT * FROM entries');
	const counts = await sql.query<{ entry_id: string; n: number }>(
		'SELECT entry_id, count(*)::int AS n FROM entry_images GROUP BY entry_id'
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
		'SELECT entry_id, name, role FROM credits ORDER BY sort_order'
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
