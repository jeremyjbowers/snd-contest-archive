import { byArchiveOrder } from './page';
import { emptyQuery } from './filter';
import type { EntryQuery, EntrySummary, Facets } from './types';

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
	facets: Facets | null;
};

let opening: Promise<{ ordered: EntrySummary[]; bucket: number; facets: Facets }> | null = null;

let cache: ShuffleCache | null = null;

export function clearShuffleCache() {
	cache = null;
}

/**
 * The draw for this window, if this process already built it.
 * Callers can serve the homepage without reading the catalog again.
 */
export function cachedOpenBrowse(bucket: number) {
	if (cache?.bucket !== bucket) return null;
	return { ordered: cache.ordered, bucket, facets: cache.facets };
}

/**
 * Build the open-archive draw once per window, including when several requests
 * arrive together. Later requests in that window reuse it and skip the catalog.
 */
export async function openBrowse(
	load: () => Promise<{ entries: EntrySummary[]; facets: Facets }>,
	now = Date.now()
) {
	const bucket = shuffleBucket(now);
	const hit = cachedOpenBrowse(bucket);
	if (hit?.facets) return { ordered: hit.ordered, bucket, facets: hit.facets };
	if (!opening) {
		opening = load()
			.then((loaded) => {
				const browse = browseEntries(loaded.entries, emptyQuery(), null, now);
				if (cache && browse.bucket != null) cache.facets = loaded.facets;
				return {
					ordered: browse.ordered,
					bucket: browse.bucket ?? bucket,
					facets: loaded.facets
				};
			})
			.finally(() => {
				opening = null;
			});
	}
	return opening;
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
	const at = new Map<string, number[]>();
	const deferred: EntrySummary[] = [];

	for (const entry of entries) {
		if (clashesAt(at, entry, placed.length, gap)) deferred.push(entry);
		else pushAt(placed, at, entry, placed.length);
	}

	for (const entry of deferred) {
		let index = placed.length;
		for (let candidate = 0; candidate <= placed.length; candidate++) {
			if (!clashesAt(at, entry, candidate, gap)) {
				index = candidate;
				break;
			}
		}
		insertAt(placed, at, entry, index);
	}

	return placed;
}

function clashesAt(at: Map<string, number[]>, entry: EntrySummary, index: number, gap: number) {
	const spots = at.get(workKey(entry));
	if (!spots) return false;
	for (const i of spots) {
		const distance = i < index ? index - i : i - index + 1;
		if (distance < gap) return true;
	}
	return false;
}

function pushAt(
	placed: EntrySummary[],
	at: Map<string, number[]>,
	entry: EntrySummary,
	index: number
) {
	placed.push(entry);
	const key = workKey(entry);
	const spots = at.get(key);
	if (spots) spots.push(index);
	else at.set(key, [index]);
}

function insertAt(
	placed: EntrySummary[],
	at: Map<string, number[]>,
	entry: EntrySummary,
	index: number
) {
	placed.splice(index, 0, entry);
	for (const spots of at.values()) {
		for (let i = 0; i < spots.length; i++) {
			if (spots[i] >= index) spots[i] += 1;
		}
	}
	const key = workKey(entry);
	const spots = at.get(key);
	if (spots) spots.push(index);
	else at.set(key, [index]);
}

function cachedOpenOrder(entries: EntrySummary[], now: number) {
	const bucket = shuffleBucket(now);
	const stamp = fingerprint(entries);
	if (cache?.bucket === bucket && cache.fingerprint === stamp) {
		return { ordered: cache.ordered, bucket };
	}
	const ordered = orderEntries(entries, bucket);
	cache = {
		bucket,
		fingerprint: stamp,
		ordered,
		facets: cache?.bucket === bucket ? cache.facets : null
	};
	return { ordered, bucket };
}

function orderForBucket(entries: EntrySummary[], bucket: number) {
	const stamp = fingerprint(entries);
	if (cache?.bucket === bucket && cache.fingerprint === stamp) return cache.ordered;
	const ordered = orderEntries(entries, bucket);
	if (bucket === shuffleBucket()) {
		cache = {
			bucket,
			fingerprint: stamp,
			ordered,
			facets: cache?.bucket === bucket ? cache.facets : null
		};
	}
	return ordered;
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
