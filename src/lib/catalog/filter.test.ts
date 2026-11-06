import assert from 'node:assert/strict';
import test from 'node:test';
import { filterEntries } from './filter';
import type { Entry } from './types';

function entry(patch: Partial<Entry> & Pick<Entry, 'id'>): Entry {
	return {
		title: patch.id,
		publication: 'Paper',
		year: 2024,
		award: 'Gold',
		category: 'News',
		subcategory: null,
		discipline: 'News design',
		platform: 'Print',
		topic: null,
		description: null,
		citation: null,
		url: null,
		thumbnail: '',
		images: [],
		credits: [],
		awards: ['Gold'],
		student: false,
		nonEditorial: false,
		multiWinner: false,
		access: 'public',
		...patch
	};
}

const rows = [
	entry({
		id: 'maps',
		title: 'Lines of Advance',
		category: 'Illustration',
		subcategory: 'Weekly section',
		topic: 'Conflict',
		credits: [{ name: 'Ingrid Holm', role: 'Illustrator' }]
	}),
	entry({
		id: 'budget',
		title: 'Where the Money Goes',
		category: 'Infographic',
		credits: [{ name: 'Harper Quinn', role: 'Designer' }]
	})
];

test('the main search matches a category, subcategory, or topic', () => {
	assert.deepEqual(
		filterEntries(rows, { q: 'illustration' }).map((row) => row.id),
		['maps']
	);
	assert.deepEqual(
		filterEntries(rows, { q: 'weekly section' }).map((row) => row.id),
		['maps']
	);
	assert.deepEqual(
		filterEntries(rows, { q: 'conflict' }).map((row) => row.id),
		['maps']
	);
});

test('the main search matches a credited name', () => {
	assert.deepEqual(
		filterEntries(rows, { q: 'ingrid' }).map((row) => row.id),
		['maps']
	);
	assert.deepEqual(
		filterEntries(rows, { q: 'harper' }).map((row) => row.id),
		['budget']
	);
});

test('a person query matches the credit and not the title', () => {
	assert.deepEqual(
		filterEntries(rows, { person: 'Quinn' }).map((row) => row.id),
		['budget']
	);
	assert.deepEqual(
		filterEntries(rows, { person: 'Money' }).map((row) => row.id),
		[]
	);
});
