import assert from 'node:assert/strict';
import test from 'node:test';
import { CARD_PAGE, byArchiveOrder, pageOf } from './page';
import type { EntrySummary } from './types';

function entry(id: string, year: number, publication: string): EntrySummary {
	return {
		id,
		title: id,
		publication,
		year,
		award: 'Gold',
		category: 'News',
		subcategory: null,
		discipline: 'News design',
		platform: 'Print',
		topic: null,
		thumbnail: '',
		awards: ['Gold'],
		student: false,
		nonEditorial: false,
		multiWinner: false,
		access: 'public',
		imageCount: 0
	};
}

test('archive pages are newest-first and do not overlap', () => {
	const ordered = byArchiveOrder([
		entry('b', 2024, 'Paper'),
		entry('a', 2025, 'Paper'),
		entry('c', 2025, 'Daily'),
		entry('d', 2025, 'Daily')
	]);
	assert.deepEqual(
		ordered.map((item) => item.id),
		['c', 'd', 'a', 'b']
	);

	const first = pageOf(ordered, 0, 2);
	const second = pageOf(ordered, first.entries.length, 2);
	assert.equal(first.total, 4);
	assert.deepEqual(
		first.entries.map((item) => item.id),
		['c', 'd']
	);
	assert.deepEqual(
		second.entries.map((item) => item.id),
		['a', 'b']
	);
	assert.equal(pageOf(ordered, 99).entries.length, 0);
	assert.equal(pageOf(ordered, -4, 0).entries.length, 4);
	assert.equal(CARD_PAGE, 100);
});

test('each page returns 100 cards and will not return more than two pages at once', () => {
	const entries = Array.from({ length: 250 }, (_, index) =>
		entry(String(index).padStart(3, '0'), 2020, 'Paper')
	);
	assert.equal(pageOf(entries, 0).entries.length, 100);
	assert.equal(pageOf(entries, 100).entries.length, 100);
	assert.equal(pageOf(entries, 200).entries.length, 50);
	assert.equal(pageOf(entries, 0, 500).entries.length, 200);
});
