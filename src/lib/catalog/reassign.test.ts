import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCsv } from './parse-csv';
import {
	assignmentChanged,
	buildReassignment,
	classificationKey,
	type MappingSource
} from './reassign';

function load() {
	const mapping = parseCsv(readFileSync('data/category-mapping-assigned.csv', 'utf8')).map(
		(row): MappingSource => ({
			rowKey: row.row_key,
			entryCount: Number(row.entry_count) || 0,
			year: row.year,
			currentCategory: row.current_category,
			currentSubcategory: row.current_subcategory,
			currentDiscipline: row.current_discipline,
			currentPlatform: row.current_platform,
			proposedCategory: row.proposed_category,
			proposedSubcategory: row.proposed_subcategory,
			proposedTopic: row.proposed_topic,
			proposedDiscipline: row.proposed_discipline,
			generalCategory: row.general_category,
			platformDetail: row.platform_detail
		})
	);
	const platforms = new Map(
		parseCsv(readFileSync('data/platform-fixes.csv', 'utf8')).map((row) => [
			row.row_key,
			row.suggested_platform
		])
	);
	return buildReassignment(mapping, platforms);
}

test('a single sheet class becomes its proposed category', () => {
	const { assignments } = load();
	const next = assignments.get(
		classificationKey({
			year: 2023,
			category: 'Category 3Ha - Broadsheet',
			subcategory: '',
			discipline: 'News design',
			platform: 'Print'
		})
	);
	assert.ok(next);
	assert.equal(next.category, 'Inside Pages (News)');
	assert.equal(next.subcategory, 'Broadsheet');
	assert.equal(next.discipline, 'News design');
	assert.equal(next.topic, null);
	assert.equal(next.platform, 'Print');
});

test('a platform fix is applied when the class has one proposal', () => {
	const { assignments } = load();
	const next = assignments.get(
		classificationKey({
			year: 2022,
			category: 'Design: Social Issues',
			subcategory: null,
			discipline: 'News design',
			platform: 'Social'
		})
	);
	assert.ok(next);
	assert.equal(next.platform, 'Digital');
	assert.equal(next.category, 'Story Page Design');
	assert.equal(next.subcategory, 'Social Issues');
	assert.equal(next.topic, 'Identity & society');
});

test('a class with two proposals is not assigned', () => {
	const { assignments, conflicts } = load();
	const key = classificationKey({
		year: '2019',
		category: '4',
		subcategory: '',
		discipline: 'Illustration & animation',
		platform: 'Digital'
	});
	assert.equal(assignments.has(key), false);
	assert.ok(conflicts.some((conflict) => conflict.key === key && conflict.proposals > 1));
});

test('a general category stored in place of the category number is reassigned', () => {
	const { assignments } = load();
	const next = assignments.get(
		classificationKey({
			year: 2017,
			category: 'Features: Single-subject project',
			subcategory: null,
			discipline: 'News design',
			platform: 'Digital'
		})
	);
	assert.ok(next);
	assert.equal(next.category, 'Features');
	assert.equal(next.subcategory, 'Single-subject project');
});

test('a shared general category with several proposals is not assigned', () => {
	const { assignments } = load();
	const key = classificationKey({
		year: 2018,
		category: 'Story Page Design – News Features or Planned Coverage',
		subcategory: '',
		discipline: 'News design',
		platform: 'Digital'
	});
	assert.equal(assignments.has(key), false);
});

test('platform detail stored as the subcategory selects that sheet row', () => {
	const { assignments } = load();
	const next = assignments.get(
		classificationKey({
			year: 2024,
			category: 'International',
			subcategory: 'Inside page',
			discipline: 'News design',
			platform: 'Print'
		})
	);
	assert.ok(next);
	assert.equal(next.category, 'Page Design');
	assert.equal(next.subcategory, 'International');
});

test('extra spaces in a stored label still find the sheet row', () => {
	const { assignments } = load();
	const next = assignments.get(
		classificationKey({
			year: 2019,
			category: 'Format:  Video',
			subcategory: null,
			discipline: 'Video',
			platform: 'Digital'
		})
	);
	assert.ok(next);
	assert.equal(next.category, 'Format');
	assert.equal(next.subcategory, 'Video');
});

test('an entry already on the proposal is not a change', () => {
	const next = {
		category: 'Inside Pages (News)',
		subcategory: 'Broadsheet',
		topic: null,
		discipline: 'News design',
		platform: 'Print'
	};
	assert.equal(
		assignmentChanged(
			{
				year: 2023,
				category: 'Inside Pages (News)',
				subcategory: 'Broadsheet',
				discipline: 'News design',
				platform: 'Print',
				topic: null
			},
			next
		),
		false
	);
	assert.equal(
		assignmentChanged(
			{
				year: 2023,
				category: 'Category 3Ha - Broadsheet',
				subcategory: null,
				discipline: 'News design',
				platform: 'Print',
				topic: 'Category 3Ha - Broadsheet'
			},
			next
		),
		true
	);
});
