import type { Access, Credit, Entry } from './types';

/** Read the JSON `awards` column, falling back to the single flag value. */
export function storedAwards(value: unknown, primary: string): string[] {
	if (typeof value === 'string' && value.startsWith('[')) {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (
				Array.isArray(parsed) &&
				parsed.every((item) => typeof item === 'string') &&
				parsed.length
			) {
				return parsed;
			}
		} catch {
			// Fall through to the primary award.
		}
	}
	return primary ? [primary] : [];
}

export function entryFromRow(
	row: Record<string, unknown>,
	images: string[],
	credits: Credit[]
): Entry {
	const award = String(row.award ?? '');
	const thumbnail = String(row.thumbnail ?? '');
	return {
		id: String(row.id),
		title: String(row.title),
		publication: String(row.publication),
		year: Number(row.year),
		award,
		category: String(row.category),
		subcategory: row.subcategory ? String(row.subcategory) : null,
		discipline: String(row.discipline),
		platform: String(row.platform),
		topic: row.topic ? String(row.topic) : null,
		description: row.description ? String(row.description) : null,
		citation: row.citation ? String(row.citation) : null,
		url: row.url ? String(row.url) : null,
		thumbnail,
		images: images.length ? images : thumbnail ? [thumbnail] : [],
		credits,
		awards: storedAwards(row.awards, award),
		student: Number(row.student) === 1,
		nonEditorial: Number(row.non_editorial) === 1,
		multiWinner: Number(row.multi_winner) === 1,
		access: row.access === 'member' ? 'member' : ('public' as Access)
	};
}
