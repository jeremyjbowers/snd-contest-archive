import { parseAwards } from '../catalog/ingest/awards';
import { classifyCategory } from '../catalog/ingest/categories';
import raw from './observations.json';

export type FieldGroup = 'design' | 'source';

export type ValueRow = {
	value: string;
	count: number;
	yearMin: number | null;
	yearMax: number | null;
	sources: string[];
	note: string;
};

export type FieldSummary = {
	id: string;
	label: string;
	group: FieldGroup;
	blurb: string;
	distinct: number;
	entries: number;
	examples: string[];
	href: string;
	attentionEntries: number;
};

export type ClassRow = {
	source: string;
	year: number | null;
	count: number;
	parent: string;
	category: string;
	subcategory: string;
	platform: string;
	platformDetail: string;
	generalCategory: string;
	categoryNumber: string;
	specificCategory: string;
	platformDefault: string;
	outCategory: string;
	outSubcategory: string | null;
	outTopic: string | null;
	outDiscipline: string;
	outPlatform: string;
	student: boolean;
	nonEditorial: boolean;
	fallback: boolean;
	/** Reasons to show on the row. */
	attention: string[];
	/** High-signal reasons. The category and topic filters use this. */
	review: boolean;
};

type RawClass = {
	source: string;
	year: number | null;
	count: number;
	parent: string;
	category: string;
	subcategory: string;
	platform: string;
	platformDetail: string;
	generalCategory: string;
	categoryNumber: string;
	specificCategory: string;
	platformDefault: string;
};

type RawScalar = {
	field: string;
	value: string;
	count: number;
	source: string;
	year: number | null;
};

type RawFile = {
	readOn: string;
	classes: RawClass[];
	scalars: RawScalar[];
	sources: { source: string; entries: number; years: number[] }[];
	honorSheet: { source: string; entries: number; years: number[] } | null;
};

const data = raw as RawFile;

const CIRCULATION = /page views|college\/university/i;

export type Inventory = {
	readOn: string;
	entries: number;
	sources: { source: string; entries: number; years: number[] }[];
	honorEntries: number;
	classes: ClassRow[];
	fields: FieldSummary[];
	values: Record<string, ValueRow[]>;
};

let cached: Inventory | null = null;

export function getInventory(): Inventory {
	if (!cached) cached = buildInventory(data);
	return cached;
}

export function buildInventory(file: RawFile): Inventory {
	const classes = file.classes.map(classify);
	const labelOutputs = new Map<string, Set<string>>();
	for (const row of classes) {
		if (!row.category) continue;
		const set = labelOutputs.get(row.category) ?? new Set<string>();
		set.add(row.outCategory);
		labelOutputs.set(row.category, set);
	}
	for (const row of classes) {
		const outputs = row.category ? labelOutputs.get(row.category) : undefined;
		if (outputs && outputs.size > 1) {
			row.attention.push('This category text maps to more than one archive category');
			row.review = true;
		}
	}

	const values: Record<string, ValueRow[]> = {
		award: canonicalAwards(file.scalars.filter((row) => row.field === 'award')),
		category: tallyClasses(classes, (row) => row.outCategory),
		subcategory: tallyClasses(classes, (row) => row.outSubcategory || ''),
		topic: tallyClasses(classes, (row) => row.outTopic || ''),
		discipline: tallyClasses(classes, (row) => row.outDiscipline),
		platform: tallyClasses(classes, (row) => row.outPlatform),
		publication: tallyScalars(file.scalars.filter((row) => row.field === 'publication')),
		year: tallyClasses(classes, (row) => (row.year == null ? '' : String(row.year))),
		'award-raw': tallyScalars(
			file.scalars.filter((row) => row.field === 'award'),
			true
		),
		'parent-category': tallyClasses(classes, (row) => row.parent),
		'raw-category': tallyClasses(classes, (row) => row.category),
		'raw-subcategory': tallyClasses(classes, (row) => row.subcategory),
		'general-category': tallyClasses(classes, (row) => row.generalCategory),
		'category-number': tallyClasses(classes, (row) => row.categoryNumber),
		'specific-category': tallyClasses(classes, (row) => row.specificCategory),
		'platform-raw': tallyClasses(classes, (row) => row.platform),
		'platform-detail': tallyClasses(classes, (row) => row.platformDetail),
		company: tallyScalars(file.scalars.filter((row) => row.field === 'company')),
		'publication-size': tallyScalars(file.scalars.filter((row) => row.field === 'publicationSize')),
		tags: tallyScalars(file.scalars.filter((row) => row.field === 'tags')),
		'worlds-best': tallyScalars(file.scalars.filter((row) => row.field === 'worldsBest')),
		label: tallyScalars(file.scalars.filter((row) => row.field === 'label'))
	};

	const fields = FIELD_DEFS.map((field) => summarize(field, values[field.id] ?? [], classes));
	const entries = file.sources.reduce((sum, source) => sum + source.entries, 0);

	return {
		readOn: file.readOn,
		entries,
		sources: file.sources,
		honorEntries: file.honorSheet?.entries ?? 0,
		classes,
		fields,
		values
	};
}

const FIELD_DEFS: {
	id: string;
	label: string;
	group: FieldGroup;
	blurb: string;
	href?: string;
}[] = [
	{
		id: 'award',
		label: 'Award',
		group: 'design',
		blurb: 'The honor the card flag shows, after aliases are folded together.'
	},
	{
		id: 'category',
		label: 'Category',
		group: 'design',
		blurb: 'The subject the archive stores today, with the contest code stripped off.',
		href: '/admin/category'
	},
	{
		id: 'subcategory',
		label: 'Subcategory',
		group: 'design',
		blurb: 'The format, when a row has one: single page, single URL, multiple pages.'
	},
	{
		id: 'topic',
		label: 'Topic',
		group: 'design',
		blurb: 'Currently the same words as category, unless the label is only a section name.',
		href: '/admin/topic'
	},
	{
		id: 'discipline',
		label: 'Discipline',
		group: 'design',
		blurb: 'One of six buckets derived from the category text and, since 2024, the section number.'
	},
	{
		id: 'platform',
		label: 'Platform',
		group: 'design',
		blurb: 'Print, Digital, Social, Multiplatform, or Other.'
	},
	{
		id: 'publication',
		label: 'Publication',
		group: 'design',
		blurb:
			'The masthead or desk on the entry. Older sheets have one name; newer sheets also have a company.'
	},
	{
		id: 'year',
		label: 'Year',
		group: 'design',
		blurb: 'The season. A contest numbered N is the year 1978 + N. SND47 is 2025.'
	},
	{
		id: 'award-raw',
		label: 'Award, as written',
		group: 'source',
		blurb:
			'The award cell before aliases. Combined strings such as “Gold & Best in Show” and “JSR (Overall)” stay whole.'
	},
	{
		id: 'parent-category',
		label: 'Parent category',
		group: 'source',
		blurb: 'The section on 2020–2025 sheets: “1. Story Page Design”, “Category 07 - Illustration”.'
	},
	{
		id: 'raw-category',
		label: 'Category, as written',
		group: 'source',
		blurb: 'The category cell. On recent sheets this is a coded subject or a coded format.'
	},
	{
		id: 'raw-subcategory',
		label: 'Subcategory, as written',
		group: 'source',
		blurb: 'A third label, used on the 2025 sheet for the format: “6a. Print: Single page”.'
	},
	{
		id: 'general-category',
		label: 'General category',
		group: 'source',
		blurb:
			'The 2010–2021 digital subject, often “Features [Single-subject project]” or “Story Page Design – News Features or Planned Coverage”.'
	},
	{
		id: 'category-number',
		label: 'Category number',
		group: 'source',
		blurb:
			'A short code such as 05A, 8, or 3B Business+. On years without a category column, the loader reads this as the category.'
	},
	{
		id: 'specific-category',
		label: 'Specific category',
		group: 'source',
		blurb:
			'On the 2010 sheet this column is a circulation band, not a subject. The same bands appear on the early digital sheets. Counts here are the 2010 sheet.'
	},
	{
		id: 'platform-raw',
		label: 'Platform, as written',
		group: 'source',
		blurb:
			'The short platform cell. Empty on sheets that are entirely print or entirely digital; those rows still resolve from the sheet.'
	},
	{
		id: 'platform-detail',
		label: 'Platform detail',
		group: 'source',
		blurb: 'The longer format cell, “Digital: Single URL” or “Cover”. It overlaps subcategory.'
	},
	{
		id: 'company',
		label: 'Company',
		group: 'source',
		blurb:
			'The organization, separate from the masthead. On the 2025 sheet the two names differ on 178 of 1,622 rows where both are filled.'
	},
	{
		id: 'publication-size',
		label: 'Publication size',
		group: 'source',
		blurb:
			'Micro, Small, Medium, Large, or NA. Present on the 2025 sheet, used for Best in Show classes.'
	},
	{
		id: 'tags',
		label: 'Tags',
		group: 'source',
		blurb: 'A scratch cell. It mixes honors with judging notes such as Out, Duplicate, and test.'
	},
	{
		id: 'worlds-best',
		label: "World's Best phrase",
		group: 'source',
		blurb:
			'Winner, finalist, or runner-up, for a designer or a digital news experience. The dedicated sheet overlaps the Archive.'
	},
	{
		id: 'label',
		label: 'Label',
		group: 'source',
		blurb: 'The 2021–2023 digital column that stores the same World’s Best phrases.'
	}
];

function summarize(
	field: (typeof FIELD_DEFS)[number],
	rows: ValueRow[],
	classes: ClassRow[]
): FieldSummary {
	const examples = rows.slice(0, 3).map((row) => row.value || '(blank)');
	let attentionEntries = 0;
	if (field.id === 'category' || field.id === 'topic') {
		attentionEntries = classes.filter((row) => row.review).reduce((sum, row) => sum + row.count, 0);
	}
	if (field.id === 'award') {
		const unrecognized = rows.find((row) => row.value === '(not a recognized award)');
		attentionEntries = unrecognized?.count ?? 0;
	}
	return {
		id: field.id,
		label: field.label,
		group: field.group,
		blurb: field.blurb,
		distinct: rows.length,
		entries: rows.reduce((sum, row) => sum + row.count, 0),
		examples,
		href: field.href ?? `/admin/fields/${field.id}`,
		attentionEntries
	};
}

function classify(row: RawClass): ClassRow {
	const parent = row.parent || row.generalCategory;
	const category =
		row.category || row.specificCategory || row.categoryNumber || row.generalCategory;
	const classified = classifyCategory({
		year: row.year,
		parent,
		category,
		subcategory: row.subcategory,
		platform: row.platform || row.platformDetail,
		platformDefault: row.platformDefault || null
	});
	const attention: string[] = [];
	if (CIRCULATION.test(row.specificCategory) && CIRCULATION.test(classified.category)) {
		attention.push('Circulation band is being used as the category');
	}
	if (row.categoryNumber && classified.category === row.categoryNumber) {
		attention.push('Category number became the archive category');
	}
	if (classified.category === 'Uncategorized') attention.push('No category label survived');
	if (classified.usedFallbackDiscipline) attention.push('Discipline fell back to News design');
	if (!classified.topic) attention.push('Topic is empty');
	const review = attention.some(
		(reason) => !reason.startsWith('Discipline') && reason !== 'Topic is empty'
	);
	return {
		...row,
		outCategory: classified.category,
		outSubcategory: classified.subcategory,
		outTopic: classified.topic,
		outDiscipline: classified.discipline,
		outPlatform: classified.platform,
		student: classified.student,
		nonEditorial: classified.nonEditorial,
		fallback: classified.usedFallbackDiscipline,
		attention,
		review
	};
}

function canonicalAwards(rows: RawScalar[]): ValueRow[] {
	const recognized = new Map<string, ValueRow>();
	let missed = 0;
	let missedMin: number | null = null;
	let missedMax: number | null = null;
	const missedSources = new Set<string>();
	for (const row of rows) {
		const awards = parseAwards(row.value);
		if (!awards.length) {
			missed += row.count;
			missedSources.add(row.source);
			missedMin = minYear(missedMin, row.year);
			missedMax = maxYear(missedMax, row.year);
			continue;
		}
		for (const award of awards) {
			const existing = recognized.get(award);
			if (existing) {
				existing.count += row.count;
				existing.yearMin = minYear(existing.yearMin, row.year);
				existing.yearMax = maxYear(existing.yearMax, row.year);
				if (!existing.sources.includes(row.source)) existing.sources.push(row.source);
			} else {
				recognized.set(award, {
					value: award,
					count: row.count,
					yearMin: row.year,
					yearMax: row.year,
					sources: [row.source],
					note: ''
				});
			}
		}
	}
	const values = [...recognized.values()];
	if (missed) {
		values.push({
			value: '(not a recognized award)',
			count: missed,
			yearMin: missedMin,
			yearMax: missedMax,
			sources: [...missedSources],
			note: 'The cell did not match Gold, Silver, Bronze, Award of Excellence, or a World’s Best alias.'
		});
	}
	return values.sort(byCount);
}

function tallyClasses(rows: ClassRow[], pick: (row: ClassRow) => string): ValueRow[] {
	const groups = new Map<string, ValueRow>();
	for (const row of rows) {
		const value = pick(row).trim();
		if (!value) continue;
		const existing = groups.get(value);
		if (existing) {
			existing.count += row.count;
			existing.yearMin = minYear(existing.yearMin, row.year);
			existing.yearMax = maxYear(existing.yearMax, row.year);
			if (!existing.sources.includes(row.source)) existing.sources.push(row.source);
		} else {
			groups.set(value, {
				value,
				count: row.count,
				yearMin: row.year,
				yearMax: row.year,
				sources: [row.source],
				note: ''
			});
		}
	}
	for (const group of groups.values()) group.sources.sort();
	return [...groups.values()].sort(byCount);
}

function tallyScalars(rows: RawScalar[], noteRaw = false): ValueRow[] {
	const groups = new Map<string, ValueRow>();
	for (const row of rows) {
		const existing = groups.get(row.value);
		const parsed = noteRaw ? parseAwards(row.value) : [];
		const note = noteRaw ? (parsed.length ? parsed.join(', ') : 'Not recognized') : '';
		if (existing) {
			existing.count += row.count;
			existing.yearMin = minYear(existing.yearMin, row.year);
			existing.yearMax = maxYear(existing.yearMax, row.year);
			if (!existing.sources.includes(row.source)) existing.sources.push(row.source);
		} else {
			groups.set(row.value, {
				value: row.value,
				count: row.count,
				yearMin: row.year,
				yearMax: row.year,
				sources: [row.source],
				note
			});
		}
	}
	for (const group of groups.values()) group.sources.sort();
	return [...groups.values()].sort(byCount);
}

function byCount(a: ValueRow, b: ValueRow) {
	return b.count - a.count || a.value.localeCompare(b.value);
}

function minYear(current: number | null, year: number | null) {
	if (year == null) return current;
	if (current == null) return year;
	return Math.min(current, year);
}

function maxYear(current: number | null, year: number | null) {
	if (year == null) return current;
	if (current == null) return year;
	return Math.max(current, year);
}

export function sourceLines(row: ClassRow) {
	const pairs = [
		['Parent', row.parent],
		['Category', row.category],
		['Subcategory', row.subcategory],
		['General category', row.generalCategory],
		['Category number', row.categoryNumber],
		['Specific category', row.specificCategory],
		['Platform', row.platform],
		['Platform detail', row.platformDetail]
	] as const;
	return pairs.filter((pair) => pair[1]).map(([label, value]) => ({ label, value }));
}

export function presentClass(row: ClassRow) {
	return {
		key: [
			row.source,
			row.year,
			row.parent,
			row.category,
			row.subcategory,
			row.generalCategory,
			row.categoryNumber,
			row.specificCategory,
			row.platform,
			row.platformDetail,
			row.outCategory
		].join('|'),
		source: row.source,
		year: row.year,
		count: row.count,
		lines: sourceLines(row),
		outCategory: row.outCategory,
		outSubcategory: row.outSubcategory,
		outTopic: row.outTopic,
		outDiscipline: row.outDiscipline,
		outPlatform: row.outPlatform,
		student: row.student,
		nonEditorial: row.nonEditorial,
		attention: row.attention,
		review: row.review
	};
}

export function fieldById(id: string) {
	const inventory = getInventory();
	const field = inventory.fields.find((item) => item.id === id);
	if (!field) return null;
	return { field, values: inventory.values[id] ?? [] };
}
