import assert from 'node:assert/strict';
import test from 'node:test';
import { byArchiveOrder } from './page';
import {
	SAME_WORK_GAP,
	SHUFFLE_WINDOW_MS,
	browseEntries,
	clearShuffleCache,
	orderEntries,
	shuffleBucket,
	spreadSameWork,
	workKey
} from './shuffle';
import type { EntrySummary } from './types';
import { emptyQuery } from './filter';

function entry(
	id: string,
	title: string,
	publication: string,
	year: number,
	award = 'Gold'
): EntrySummary {
	return {
		id,
		title,
		publication,
		year,
		award,
		category: 'News',
		subcategory: null,
		discipline: 'News design',
		platform: 'Print',
		topic: null,
		thumbnail: '',
		awards: [award],
		student: false,
		nonEditorial: false,
		multiWinner: false,
		access: 'public',
		imageCount: 0
	};
}

function ids(entries: EntrySummary[]) {
	return entries.map((item) => item.id);
}

test('a shuffle window is stable and the next window is a new draw', () => {
	clearShuffleCache();
	const entries = [
		entry('a', 'Alpha', 'Daily', 2024),
		entry('b', 'Beta', 'Paper', 2025),
		entry('c', 'Gamma', 'Herald', 2023),
		entry('d', 'Delta', 'Post', 2022),
		entry('e', 'Epsilon', 'Times', 2021),
		entry('f', 'Zeta', 'Globe', 2020),
		entry('g', 'Eta', 'Star', 2019),
		entry('h', 'Theta', 'Mail', 2018)
	];

	const first = browseEntries(entries, emptyQuery(), null, 0);
	const again = browseEntries(entries, emptyQuery(), null, SHUFFLE_WINDOW_MS - 1);
	assert.equal(first.bucket, 0);
	assert.equal(again.ordered, first.ordered);

	const next = browseEntries(entries, emptyQuery(), null, SHUFFLE_WINDOW_MS);
	assert.equal(next.bucket, shuffleBucket(SHUFFLE_WINDOW_MS));
	assert.notDeepEqual(ids(next.ordered), ids(first.ordered));

	const pinned = browseEntries(entries, emptyQuery(), first.bucket, SHUFFLE_WINDOW_MS * 4);
	assert.deepEqual(ids(pinned.ordered), ids(first.ordered));
	assert.equal(browseEntries(entries, emptyQuery(), null, SHUFFLE_WINDOW_MS).ordered, next.ordered);
});

test('filtered browse stays newest-first and ignores a shuffle bucket', () => {
	clearShuffleCache();
	const entries = [
		entry('old', 'Old', 'Paper', 2020),
		entry('new', 'New', 'Daily', 2025),
		entry('mid', 'Mid', 'Herald', 2023)
	];
	const filtered = browseEntries(entries, { ...emptyQuery(), awards: ['Gold'] }, 3, 0);
	assert.equal(filtered.bucket, null);
	assert.deepEqual(ids(filtered.ordered), ['new', 'mid', 'old']);
});

test('two category submissions of one work are not neighbors', () => {
	const entries = [
		entry('gold', 'Flood', 'The Post', 2024),
		entry('silver', '  flood ', 'the post', 2024),
		entry('b', 'Maps', 'Daily', 2024),
		entry('c', 'Night', 'Herald', 2023),
		entry('d', 'Desk', 'Times', 2022),
		entry('e', 'Cover', 'Globe', 2021)
	];
	assert.equal(workKey(entries[0]), workKey(entries[1]));

	const ordered = byArchiveOrder(entries);
	const before = ids(ordered);
	assert.ok(Math.abs(before.indexOf('gold') - before.indexOf('silver')) < SAME_WORK_GAP);
	const spread = spreadSameWork(ordered);
	const goldAt = ids(spread).indexOf('gold');
	const silverAt = ids(spread).indexOf('silver');
	assert.ok(Math.abs(goldAt - silverAt) >= SAME_WORK_GAP);

	const shuffled = orderEntries(entries, 2);
	const left = ids(shuffled).indexOf('gold');
	const right = ids(shuffled).indexOf('silver');
	assert.ok(Math.abs(left - right) >= SAME_WORK_GAP);
});
