import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assignedTopicByRowKey } from './categoryMapping.ts';
import { buildInventory, getInventory, presentClass, type ClassRow } from './inventory.ts';

const file = {
	readOn: '2026-10-30',
	sources: [{ source: 'fixture', entries: 3, years: [2010, 2025] }],
	honorSheet: null,
	scalars: [
		{ field: 'award', value: 'Gold & Best in Show', count: 2, source: '2010', year: 2010 },
		{ field: 'award', value: 'Award of Excellence', count: 4, source: 'SND47 Results', year: 2025 }
	],
	classes: [
		blank({
			source: 'SND47 Results',
			year: 2025,
			count: 4,
			parent: '2. Infographics',
			category: '2h. Sports',
			subcategory: '2h. Print: Single page',
			platform: 'Print'
		}),
		blank({
			source: '2010',
			year: 2010,
			count: 13,
			generalCategory: 'Use of multimedia',
			specificCategory: 'Up to 49,999 page views/month',
			categoryNumber: '09A',
			platformDefault: 'Digital'
		})
	]
};

test('a 2025 sports row keeps the subject and the format', () => {
	const row = buildInventory(file).classes[0];
	assert.equal(row?.outCategory, 'Sports');
	assert.equal(row?.outSubcategory, 'Single page');
	assert.equal(row?.outDiscipline, 'Infographics');
	assert.equal(row?.outPlatform, 'Print');
	assert.equal(row?.outTopic, null);
	assert.equal(row?.review, false);
});

test('a circulation band is not treated as a settled category', () => {
	const row = buildInventory(file).classes[1];
	assert.match(row?.outCategory ?? '', /page views/);
	assert.equal(row?.review, true);
	assert.ok(row?.attention.some((reason) => /circulation/i.test(reason)));
});

test('combined award strings stay visible as unrecognized', () => {
	const award = buildInventory(file).values.award ?? [];
	assert.equal(
		award.some((row) => row.value === 'Award of Excellence'),
		true
	);
	assert.equal(
		award.some((row) => row.value === '(not a recognized award)'),
		true
	);
});

test('topics follow the mapping and do not copy the category', () => {
	const topics = assignedTopicByRowKey(readFileSync('data/category-mapping-assigned.csv', 'utf8'));
	const inventory = getInventory();
	let assigned = 0;
	let empty = 0;
	for (const row of inventory.classes) {
		const expected = topics.get(presentClass(row).key) ?? null;
		assert.equal(row.outTopic, expected);
		if (expected) assigned += 1;
		else empty += 1;
	}
	assert.ok(assigned > 0);
	assert.ok(empty > assigned);
});

test('the sheet snapshot covers the recent results and the archive', () => {
	const inventory = getInventory();
	assert.ok(inventory.entries > 10000);
	assert.ok(inventory.sources.some((source) => source.source === 'SND47 Results'));
	assert.ok(inventory.fields.some((field) => field.id === 'category' && field.distinct > 1));
});

function blank(row: Partial<ClassRow> & Pick<ClassRow, 'source' | 'year' | 'count'>): ClassRow {
	return {
		parent: '',
		category: '',
		subcategory: '',
		platform: '',
		platformDetail: '',
		generalCategory: '',
		categoryNumber: '',
		specificCategory: '',
		platformDefault: '',
		outCategory: '',
		outSubcategory: null,
		outTopic: null,
		outDiscipline: '',
		outPlatform: '',
		student: false,
		nonEditorial: false,
		fallback: false,
		attention: [],
		review: false,
		...row
	};
}
