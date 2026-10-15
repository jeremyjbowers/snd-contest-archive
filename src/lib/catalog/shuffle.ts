import { byArchiveOrder } from './page';
import type { EntryQuery, EntrySummary } from './types';

/**
 * How long one homepage draw stays up.
 * Everyone in the window sees the same cards; the next window is a new draw.
 */
export const SHUFFLE_MINUTES = 15;
export const SHUFFLE_WINDOW_MS = SHUFFLE_MINUTES * 60 * 1000;

/**
 * Minimum index distance between two cards for the same work.
 * Four keeps them off the same row of the three-column grid and out of the same column.
 */
export const SAME_WORK_GAP = 4;

type ShuffleCache = {
	bucket: number;
	fingerprint: string;
	ordered: EntrySummary[];
};

let cache: ShuffleCache | null = null;

export function clearShuffleCache() {
	cache = null;
}

export function shuffleBucket(now = Date.now()) {
	return Math.floor(now / SHUFFLE_WINDOW_MS);
}

/** Open archive, with no search and no filters. That view is the shuffled homepage. */
export function isOpenBrowse(query: Partial<EntryQuery>) {
	const lists = [
		query.disciplines,
		query.awards,
		query.platforms,
		query.organizations,
		query.topics,
		query.categories,
		query.special
	];
	if (lists.some((list) => list?.length)) return false;
	if (query.q?.trim() || query.person?.trim()) return false;
	if (query.yearMin != null || query.yearMax != null) return false;
	return true;
}

/**
 * Homepage order for this window, reused until the window or the catalog changes.
 * Filtered browses stay newest-first. `bucket` pins a window so the next page
 * matches the one the visitor already has.
 */
export function browseEntries(
	entries: EntrySummary[],
	query: Partial<EntryQuery>,
	bucket: number | null,
	now = Date.now()
) {
	if (!isOpenBrowse(query)) {
		return { ordered: orderEntries(entries, null), bucket: null as number | null };
	}
	if (bucket == null) return cachedOpenOrder(entries, now);
	return { ordered: orderForBucket(entries, bucket), bucket };
}

export function orderEntries(entries: EntrySummary[], bucket: number | null) {
	const chronological = byArchiveOrder(entries);
	const ordered = bucket == null ? chronological : seededShuffle(chronological, bucket);
	return spreadSameWork(ordered);
}

/** Same title, publication, and year: two category submissions of one work. */
export function workKey(entry: Pick<EntrySummary, 'title' | 'publication' | 'year'>) {
	return `${entry.year}\0${fold(entry.publication)}\0${fold(entry.title)}`;
}

/**
 * Move a later copy of the same work at least `gap` cards away.
 * Copies that cannot sit that far apart stay as far apart as the list allows.
 */
export function spreadSameWork(entries: EntrySummary[], gap = SAME_WORK_GAP) {
	const placed: EntrySummary[] = [];
	const deferred: EntrySummary[] = [];

	for (const entry of entries) {
		if (clashes(placed, entry, placed.length, gap)) deferred.push(entry);
		else placed.push(entry);
	}

	for (const entry of deferred) {
		let index = placed.length;
		for (let candidate = 0; candidate <= placed.length; candidate++) {
			if (!clashes(placed, entry, candidate, gap)) {
				index = candidate;
				break;
			}
		}
		placed.splice(index, 0, entry);
	}

	return placed;
}

function cachedOpenOrder(entries: EntrySummary[], now: number) {
	const bucket = shuffleBucket(now);
	const stamp = fingerprint(entries);
	if (cache?.bucket === bucket && cache.fingerprint === stamp) {
		return { ordered: cache.ordered, bucket };
	}
	const ordered = orderEntries(entries, bucket);
	cache = { bucket, fingerprint: stamp, ordered };
	return { ordered, bucket };
}

function orderForBucket(entries: EntrySummary[], bucket: number) {
	const stamp = fingerprint(entries);
	if (cache?.bucket === bucket && cache.fingerprint === stamp) return cache.ordered;
	const ordered = orderEntries(entries, bucket);
	if (bucket === shuffleBucket()) cache = { bucket, fingerprint: stamp, ordered };
	return ordered;
}

function clashes(placed: EntrySummary[], entry: EntrySummary, index: number, gap: number) {
	const key = workKey(entry);
	for (let i = 0; i < placed.length; i++) {
		if (workKey(placed[i]) !== key) continue;
		const distance = i < index ? index - i : i - index + 1;
		if (distance < gap) return true;
	}
	return false;
}

function seededShuffle(entries: EntrySummary[], bucket: number) {
	const next = entries.slice();
	const random = mulberry32(bucket);
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const swap = next[i];
		next[i] = next[j];
		next[j] = swap;
	}
	return next;
}

function mulberry32(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = Math.imul(state ^ (state >>> 15), state | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function fingerprint(entries: EntrySummary[]) {
	let hash = 5381;
	for (const entry of entries) {
		const token = `${entry.id}\0${entry.year}\0${entry.award}\0${entry.category}\0${entry.title}`;
		let item = 5381;
		for (let i = 0; i < token.length; i++) item = Math.imul(item, 33) ^ token.charCodeAt(i);
		hash ^= item;
	}
	return `${entries.length}:${hash >>> 0}`;
}

function fold(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
