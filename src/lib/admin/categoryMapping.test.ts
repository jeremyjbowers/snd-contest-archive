import assert from 'node:assert/strict';
import test from 'node:test';
import {
	draftVocabulary,
	draftsFromMappingCsv,
	mappingRowsToCsv,
	proposedDiscipline,
	splitColonLabel,
	suggestFromSheetLines
} from './categoryMapping.ts';

test('splitColonLabel splits Graphics subject lines', () => {
	assert.deepEqual(splitColonLabel('Graphics: Features and planned coverage'), {
		category: 'Graphics',
		subcategory: 'Features and planned coverage'
	});
});

test('suggestFromSheetLines prefers general category', () => {
	assert.deepEqual(
		suggestFromSheetLines([
			{ label: 'General category', value: 'Graphics: Features and planned coverage' },
			{ label: 'Category number', value: '8' }
		]),
		{ category: 'Graphics', subcategory: 'Features and planned coverage', topic: '' }
	);
});

test('draftVocabulary collects unique trimmed values', () => {
	assert.deepEqual(
		draftVocabulary(
			{
				a: {
					category: 'Graphics',
					subcategory: 'Features',
					topic: '',
					discipline: '',
					done: false
				},
				b: {
					category: 'Graphics',
					subcategory: 'Sports',
					topic: 'Sports',
					discipline: 'Video',
					done: true
				}
			},
			['News design', 'Infographics']
		),
		{
			categories: ['Graphics'],
			subcategories: ['Features', 'Sports'],
			topics: ['Sports'],
			disciplines: ['Infographics', 'News design', 'Video']
		}
	);
});

test('proposedDiscipline falls back to the current ingest value', () => {
	assert.equal(
		proposedDiscipline(
			{ category: '', subcategory: '', topic: '', discipline: '', done: false },
			'Infographics'
		),
		'Infographics'
	);
	assert.equal(
		proposedDiscipline(
			{ category: '', subcategory: '', topic: '', discipline: 'News design', done: false },
			'Infographics'
		),
		'News design'
	);
});

test('draftsFromMappingCsv keeps rows with proposed fields or done', () => {
	const csv = [
		'done,row_key,proposed_category,proposed_subcategory,proposed_topic,current_discipline',
		'true,k1,Graphics,Features,,Infographics',
		'false,k2,,,,News design',
		'false,k3,Features,Single,,News design'
	].join('\n');
	const drafts = draftsFromMappingCsv(csv);
	assert.equal(Object.keys(drafts).length, 2);
	assert.deepEqual(drafts.k1, {
		category: 'Graphics',
		subcategory: 'Features',
		topic: '',
		discipline: '',
		done: true
	});
});

test('mappingRowsToCsv includes header and proposed columns', () => {
	const csv = mappingRowsToCsv([
		{
			done: true,
			row_key: 'a|b',
			entry_count: 3,
			source: 'Archive',
			year: '2017',
			general_category: 'Graphics: Features and planned coverage',
			category_number: '8',
			parent: '',
			category: '',
			subcategory: '',
			platform: '',
			platform_detail: '',
			current_category: '8',
			current_subcategory: '',
			current_topic: '',
			current_discipline: 'Infographics',
			current_platform: 'Digital',
			proposed_category: 'Graphics',
			proposed_subcategory: 'Features and planned coverage',
			proposed_topic: '',
			proposed_discipline: 'Infographics'
		}
	]);
	assert.match(csv, /^done,row_key,/);
	assert.match(csv, /Graphics,Features and planned coverage,/);
});
