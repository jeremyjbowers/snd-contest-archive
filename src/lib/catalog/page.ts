import type { EntrySummary } from './types';

/** First screen, plus a few rows so the next fetch starts before the grid runs out. */
export const CARD_PAGE = 24;

/** Newest season first. The id keeps a page boundary from shifting between requests. */
export function byArchiveOrder(entries: EntrySummary[]): EntrySummary[] {
	return entries.toSorted(
		(a, b) =>
			b.year - a.year || a.publication.localeCompare(b.publication) || a.id.localeCompare(b.id)
	);
}

export function pageOf(entries: EntrySummary[], offset: number, limit = CARD_PAGE) {
	const start = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
	const size =
		Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), CARD_PAGE * 2) : CARD_PAGE;
	return { entries: entries.slice(start, start + size), total: entries.length };
}
