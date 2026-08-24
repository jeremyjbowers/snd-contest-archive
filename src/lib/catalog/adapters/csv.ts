import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildFacets, filterEntries, toSummary } from '../filter';
import { parseCsv } from '../parse-csv';
import type { Access, Catalog, Credit, Entry, EntryQuery } from '../types';

function parseCredits(value: string): Credit[] {
	if (!value) return [];
	return value.split(';').map((part) => {
		const [name, role] = part.split('|').map((piece) => piece.trim());
		return { name: name ?? '', role: role ?? '' };
	});
}

function parseImages(value: string) {
	return value
		.split('|')
		.map((piece) => piece.trim())
		.filter(Boolean);
}

function flag(value: string) {
	return value === '1' || value.toLowerCase() === 'true';
}

function rowToEntry(row: Record<string, string>): Entry {
	const images = parseImages(row.images || row.thumbnail);
	return {
		id: row.id,
		title: row.title,
		publication: row.publication,
		year: Number(row.year),
		award: row.award,
		category: row.category,
		subcategory: row.subcategory || null,
		discipline: row.discipline,
		platform: row.platform,
		topic: row.topic || null,
		description: row.description || null,
		url: row.url || null,
		thumbnail: row.thumbnail || images[0] || '',
		images,
		credits: parseCredits(row.credits),
		student: flag(row.student),
		nonEditorial: flag(row.non_editorial),
		multiWinner: flag(row.multi_winner),
		access: (row.access as Access) || 'public'
	};
}

export function createCsvCatalog(relativePath: string): Catalog {
	const filePath = resolve(process.cwd(), relativePath);
	let cache: Entry[] | null = null;

	async function load() {
		if (cache) return cache;
		const text = await readFile(filePath, 'utf8');
		cache = parseCsv(text)
			.filter((row) => row.id)
			.map(rowToEntry);
		return cache;
	}

	return {
		async listEntries(query?: Partial<EntryQuery>) {
			const entries = await load();
			return filterEntries(entries, query).map(toSummary);
		},
		async getEntry(id: string) {
			const entries = await load();
			return entries.find((entry) => entry.id === id) ?? null;
		},
		async getFacets() {
			return buildFacets(await load());
		}
	};
}
