import { parseCsv } from '$lib/catalog/parse-csv';

export type CategoryDraft = {
	category: string;
	subcategory: string;
	topic: string;
	discipline: string;
	done: boolean;
};

export const EMPTY_CATEGORY_DRAFT: CategoryDraft = {
	category: '',
	subcategory: '',
	topic: '',
	discipline: '',
	done: false
};

export type SheetLine = { label: string; value: string };

export function splitColonLabel(value: string): { category: string; subcategory: string } | null {
	const colon = value.indexOf(':');
	if (colon <= 0) return null;
	const category = value.slice(0, colon).trim();
	const subcategory = value.slice(colon + 1).trim();
	if (!category || !subcategory) return null;
	return { category, subcategory };
}

const SUGGEST_LABELS = ['General category', 'Category', 'Parent'] as const;

export function suggestFromSheetLines(
	lines: SheetLine[]
): Pick<CategoryDraft, 'category' | 'subcategory' | 'topic'> {
	for (const label of SUGGEST_LABELS) {
		const line = lines.find((item) => item.label === label);
		if (!line) continue;
		const split = splitColonLabel(line.value);
		if (split) return { ...split, topic: '' };
	}
	return { category: '', subcategory: '', topic: '' };
}

export type MappingExportRow = {
	done: boolean;
	row_key: string;
	entry_count: number;
	source: string;
	year: string;
	general_category: string;
	category_number: string;
	parent: string;
	category: string;
	subcategory: string;
	platform: string;
	platform_detail: string;
	current_category: string;
	current_subcategory: string;
	current_topic: string;
	current_discipline: string;
	current_platform: string;
	proposed_category: string;
	proposed_subcategory: string;
	proposed_topic: string;
	proposed_discipline: string;
};

function lineValue(lines: SheetLine[], label: string): string {
	return lines.find((item) => item.label === label)?.value ?? '';
}

export function mappingExportRow(
	row: {
		key: string;
		source: string;
		year: number | null;
		count: number;
		lines: SheetLine[];
		outCategory: string;
		outSubcategory: string | null;
		outTopic: string | null;
		outDiscipline: string;
		outPlatform: string;
	},
	draft: CategoryDraft
): MappingExportRow {
	return {
		done: draft.done,
		row_key: row.key,
		entry_count: row.count,
		source: row.source,
		year: row.year == null ? '' : String(row.year),
		general_category: lineValue(row.lines, 'General category'),
		category_number: lineValue(row.lines, 'Category number'),
		parent: lineValue(row.lines, 'Parent'),
		category: lineValue(row.lines, 'Category'),
		subcategory: lineValue(row.lines, 'Subcategory'),
		platform: lineValue(row.lines, 'Platform'),
		platform_detail: lineValue(row.lines, 'Platform detail'),
		current_category: row.outCategory,
		current_subcategory: row.outSubcategory ?? '',
		current_topic: row.outTopic ?? '',
		current_discipline: row.outDiscipline,
		current_platform: row.outPlatform,
		proposed_category: draft.category,
		proposed_subcategory: draft.subcategory,
		proposed_topic: draft.topic,
		proposed_discipline: proposedDiscipline(draft, row.outDiscipline)
	};
}

export function proposedDiscipline(draft: CategoryDraft, current: string): string {
	const value = draft.discipline.trim();
	return value || current;
}

const CSV_COLUMNS: (keyof MappingExportRow)[] = [
	'done',
	'row_key',
	'entry_count',
	'source',
	'year',
	'general_category',
	'category_number',
	'parent',
	'category',
	'subcategory',
	'platform',
	'platform_detail',
	'current_category',
	'current_subcategory',
	'current_topic',
	'current_discipline',
	'current_platform',
	'proposed_category',
	'proposed_subcategory',
	'proposed_topic',
	'proposed_discipline'
];

function csvCell(value: string | boolean | number): string {
	const text = String(value);
	if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
	return text;
}

export function mappingRowsToCsv(rows: MappingExportRow[]): string {
	const header = CSV_COLUMNS.join(',');
	const body = rows.map((row) => CSV_COLUMNS.map((col) => csvCell(row[col])).join(','));
	return [header, ...body].join('\n');
}

export type DraftVocabulary = {
	categories: string[];
	subcategories: string[];
	topics: string[];
	disciplines: string[];
};

export function draftsFromMappingCsv(text: string): Record<string, CategoryDraft> {
	const out: Record<string, CategoryDraft> = {};
	for (const record of parseCsv(text)) {
		const rowKey = record.row_key ?? '';
		if (!rowKey) continue;

		const done = (record.done ?? '').toLowerCase() === 'true';
		const category = record.proposed_category ?? '';
		const subcategory = record.proposed_subcategory ?? '';
		const topic = record.proposed_topic ?? '';
		const proposedDiscipline = record.proposed_discipline ?? '';
		const currentDiscipline = record.current_discipline ?? '';
		const discipline =
			proposedDiscipline.trim() && proposedDiscipline !== currentDiscipline
				? proposedDiscipline.trim()
				: '';

		const hasWork = done || category.trim() || subcategory.trim() || topic.trim() || discipline;
		if (!hasWork) continue;

		out[rowKey] = {
			category: category.trim(),
			subcategory: subcategory.trim(),
			topic: topic.trim(),
			discipline,
			done
		};
	}
	return out;
}

export function draftVocabulary(
	drafts: Record<string, CategoryDraft>,
	canonicalDisciplines: readonly string[] = []
): DraftVocabulary {
	const categories = new Set<string>();
	const subcategories = new Set<string>();
	const topics = new Set<string>();
	const disciplines = new Set<string>(canonicalDisciplines);
	for (const draft of Object.values(drafts)) {
		if (draft.category.trim()) categories.add(draft.category.trim());
		if (draft.subcategory.trim()) subcategories.add(draft.subcategory.trim());
		if (draft.topic.trim()) topics.add(draft.topic.trim());
		if (draft.discipline.trim()) disciplines.add(draft.discipline.trim());
	}
	const sort = (a: string, b: string) => a.localeCompare(b);
	return {
		categories: [...categories].sort(sort),
		subcategories: [...subcategories].sort(sort),
		topics: [...topics].sort(sort),
		disciplines: [...disciplines].sort(sort)
	};
}
