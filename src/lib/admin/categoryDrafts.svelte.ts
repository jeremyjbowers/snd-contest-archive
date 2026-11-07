import { CANONICAL_FACETS } from '$lib/catalog/types';
import {
	draftVocabulary,
	draftsFromMappingCsv,
	EMPTY_CATEGORY_DRAFT,
	type CategoryDraft,
	type DraftVocabulary,
	type MappingExportRow,
	mappingExportRow,
	mappingRowsToCsv
} from './categoryMapping';

const KEY = 'snd-category-mapping-drafts';

let drafts = $state<Record<string, CategoryDraft>>({});
let ready = $state(false);

export function initCategoryDrafts() {
	if (ready || typeof localStorage === 'undefined') return;
	try {
		const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		if (stored && typeof stored === 'object') {
			drafts = stored as Record<string, CategoryDraft>;
		}
	} catch {
		drafts = {};
	}
	ready = true;
}

function persist() {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(KEY, JSON.stringify(drafts));
}

export function categoryDrafts() {
	return drafts;
}

export function categoryDraftVocabulary(): DraftVocabulary {
	return draftVocabulary(drafts, CANONICAL_FACETS.disciplines);
}

export function draftFor(key: string): CategoryDraft {
	return { ...EMPTY_CATEGORY_DRAFT, ...drafts[key] };
}

export function saveCategoryDraft(key: string, patch: Partial<CategoryDraft>) {
	drafts = {
		...drafts,
		[key]: { ...draftFor(key), ...patch }
	};
	persist();
}

export function mappingProgress(keys: string[]) {
	let done = 0;
	for (const key of keys) {
		if (drafts[key]?.done) done++;
	}
	return { done, total: keys.length };
}

export function buildMappingCsv(
	rows: Parameters<typeof mappingExportRow>[0][]
): string {
	const exportRows: MappingExportRow[] = rows.map((row) =>
		mappingExportRow(row, draftFor(row.key))
	);
	return mappingRowsToCsv(exportRows);
}

export function downloadMappingCsv(
	rows: Parameters<typeof mappingExportRow>[0][],
	filename = 'category-mapping-drafts.csv'
) {
	if (typeof document === 'undefined') return;
	const csv = buildMappingCsv(rows);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export function mergeCategoryDrafts(incoming: Record<string, CategoryDraft>) {
	initCategoryDrafts();
	drafts = { ...drafts, ...incoming };
	persist();
	return Object.keys(incoming).length;
}

export function importCategoryDraftsCsv(text: string) {
	return mergeCategoryDrafts(draftsFromMappingCsv(text));
}
