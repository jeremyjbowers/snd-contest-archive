import { asText } from './text';

/**
 * SND46 (2024) and SND47 (2025) reused section numbers for different classes.
 * Earlier books are classified from the category words instead.
 */
const SECTIONS_2024: Record<number, Section> = {
	1: { discipline: 'News design' },
	2: { discipline: 'Infographics' },
	3: { discipline: 'News design' },
	4: { discipline: 'Illustration & animation' },
	5: { discipline: 'Product design' },
	6: { discipline: 'News design', nonEditorial: true },
	7: { discipline: 'News design', student: true },
	8: { discipline: 'Art direction' }
};

const SECTIONS_2025: Record<number, Section> = {
	1: { discipline: 'News design' },
	2: { discipline: 'Infographics' },
	3: { discipline: 'News design' },
	4: { discipline: 'Illustration & animation' },
	5: { discipline: 'Video' },
	6: { discipline: 'News design' },
	7: { discipline: 'Product design' },
	8: { discipline: 'News design', nonEditorial: true },
	9: { discipline: 'News design', student: true },
	10: { discipline: 'Art direction' },
	11: { discipline: 'News design' }
};

type Section = { discipline: string; student?: boolean; nonEditorial?: boolean };

export type ClassifiedCategory = {
	category: string;
	subcategory: string | null;
	discipline: string;
	platform: string;
	topic: string | null;
	student: boolean;
	nonEditorial: boolean;
	usedFallbackDiscipline: boolean;
};

export function classifyCategory(input: {
	year: number | null;
	parent?: unknown;
	category?: unknown;
	subcategory?: unknown;
	platform?: unknown;
	printOptions?: unknown;
	platformDefault?: string | null;
}): ClassifiedCategory {
	const parent = asText(input.parent);
	const category = asText(input.category);
	const subcategory = asText(input.subcategory);
	const blob = [parent, category, subcategory].filter(Boolean).join(' ');
	const parentLabel = stripCategoryCode(parent);
	const categoryLabel = stripCategoryCode(category);
	const subLabel = stripCategoryCode(subcategory);
	const printOptions = stripCategoryCode(asText(input.printOptions));

	const foundSubject = [categoryLabel, subLabel, parentLabel].find(
		(label) => label && !isFormat(label) && !isSectionName(label)
	);
	const subject = foundSubject || categoryLabel || parentLabel || 'Uncategorized';
	const format =
		[subLabel, categoryLabel, printOptions].find(
			(label) => label && (isFormat(label) || label === printOptions)
		) ?? null;
	const formatLabel = format && format !== subject ? compactFormat(format) : null;

	const section = sectionFor(input.year, parent || category);
	const fromCategory = disciplineFromText(categoryLabel) ?? disciplineFromText(subLabel);
	const fromSection = section?.discipline ?? null;
	const fromParent = disciplineFromText(parentLabel);
	const discipline = fromCategory ?? fromSection ?? fromParent ?? 'News design';

	const platform =
		canonicalPlatform(asText(input.platform)) ??
		platformFromText(categoryLabel, subLabel, printOptions) ??
		input.platformDefault ??
		'Other';

	return {
		category: subject,
		subcategory: formatLabel,
		discipline,
		platform,
		topic: isSectionName(subject) ? null : subject,
		student: Boolean(section?.student) || /student|class work/i.test(blob),
		nonEditorial: Boolean(section?.nonEditorial) || /non-editorial|advertorial/i.test(blob),
		usedFallbackDiscipline: !fromCategory && !fromSection && !fromParent
	};
}

export function stripCategoryCode(value: string): string {
	let text = value.trim();
	if (isBlankText(text)) return '';
	text = text.replace(/^category\s+\d+\s*-\s*/i, '');
	text = text.replace(/^\d+[a-z]?\s*[.:-]\s*/i, '');
	text = text.replace(/^\d+[a-z]?\s+/i, '');
	text = text.replace(/^[a-z]\s*-\s*/i, '');
	return text.trim();
}

function isBlankText(value: string) {
	return value === '' || value === '—' || value === '-';
}

function compactFormat(label: string) {
	const match = label.match(/^(print|digital|social|multiplatform)\s*:\s*(.+)$/i);
	return match ? match[2].trim() : label;
}

function isFormat(label: string) {
	return (
		/^(print|digital|social|multiplatform)\b/i.test(label) || /^(single|multiple)\b/i.test(label)
	);
}

function isSectionName(label: string) {
	return /^(page design|infographics|illustration|special coverage|platforms and products|non-editorial|student work|portfolios|print-specific|use of multimedia)/i.test(
		label
	);
}

function sectionFor(year: number | null, label: string): Section | null {
	if (year == null || year < 2024) return null;
	const match = label.match(/(\d+)/);
	if (!match) return null;
	const map = year >= 2025 ? SECTIONS_2025 : SECTIONS_2024;
	return map[Number(match[1])] ?? null;
}

function disciplineFromText(label: string): string | null {
	if (!label) return null;
	const text = label.toLowerCase();
	if (/infographic|data visual|\bgraphic/.test(text)) return 'Infographics';
	if (/illustrat|animation/.test(text)) return 'Illustration & animation';
	if (/\bvideo\b|multimedia/.test(text)) return 'Video';
	if (/photo story/.test(text)) return 'News design';
	if (/art direction/.test(text)) return 'Art direction';
	if (/\b(ux|ui)\b|product design|newsletter|podcast|branding|website/.test(text))
		return 'Product design';
	if (/page design|special coverage|\bnews\b|\bfeature\b|breaking/.test(text)) return 'News design';
	return null;
}

export function canonicalPlatform(value: string): string | null {
	if (!value || isBlankText(value)) return null;
	return platformFromText(value);
}

function platformFromText(...parts: string[]): string | null {
	const text = parts.join(' ').toLowerCase();
	if (!text.trim()) return null;
	if (/print\s*[&+]\s*digital|multiplatform|combination/.test(text)) return 'Multiplatform';
	if (/\bsocial\b/.test(text)) return 'Social';
	if (/\bdigital\b|\burl\b/.test(text)) return 'Digital';
	if (/\bprint\b|\bcover\b|\binside page\b/.test(text)) return 'Print';
	return null;
}
