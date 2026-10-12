import { buildFacets, filterEntries, toSummary } from '../filter';
import { entryFromRow } from '../rows';
import type { Catalog, EntryQuery } from '../types';
import type { Sql } from '../persist/sql';

/** Catalog over the Postgres schema. SQLite keeps its own adapter. */
export function createSqlCatalog(sql: Sql): Catalog {
	return {
		async listEntries(query?: Partial<EntryQuery>) {
			return filterEntries(await allEntries(sql), query).map(toSummary);
		},
		async getEntry(id: string) {
			return (await allEntries(sql)).find((entry) => entry.id === id) ?? null;
		},
		async getFacets() {
			return buildFacets(await allEntries(sql));
		}
	};
}

async function allEntries(sql: Sql) {
	const rows = await sql.query('SELECT * FROM entries');
	const images = await sql.query<{ entry_id: string; url: string }>(
		'SELECT entry_id, url FROM entry_images ORDER BY sort_order'
	);
	const credits = await sql.query<{ entry_id: string; name: string; role: string }>(
		'SELECT entry_id, name, role FROM credits ORDER BY sort_order'
	);
	const imagesById = group(
		images,
		(image) => image.entry_id,
		(image) => image.url
	);
	const creditsById = group(
		credits,
		(credit) => credit.entry_id,
		(credit) => ({
			name: credit.name,
			role: credit.role
		})
	);

	return rows.map((row) =>
		entryFromRow(row, imagesById.get(String(row.id)) ?? [], creditsById.get(String(row.id)) ?? [])
	);
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
