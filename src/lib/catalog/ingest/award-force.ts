import { parseAwards } from './awards';
import { classifyCategory } from './categories';
import { parseCreditLine } from './credits';
import {
	applyClassification,
	finishRecord,
	type SourceAsset,
	type SubmissionRecord
} from './record';
import { asText, asUrl, checked, column, isBlank } from './text';

/**
 * Columns that identify the entrant or unlock a publisher paywall.
 * They are dropped before a row is turned into a submission.
 */
const SECRET = /password|paywall|instruction/i;
const SECRET_NAMES = new Set([
	'email',
	'alternate email',
	'mobile',
	'phone',
	'address',
	'city and postal code',
	'first name',
	'last name',
	'user id',
	'entrant',
	'pay mode'
]);

export function fromAwardForceRows(
	rows: Record<string, unknown>[],
	origin: string
): { records: SubmissionRecord[]; assets: SourceAsset[] } {
	const records: SubmissionRecord[] = [];
	const assets: SourceAsset[] = [];
	for (const row of rows) {
		const built = fromAwardForceRow(row, origin);
		if (!built) continue;
		records.push(built.record);
		assets.push(...built.assets);
	}
	return { records, assets };
}

function fromAwardForceRow(
	row: Record<string, unknown>,
	origin: string
): { record: SubmissionRecord; assets: SourceAsset[] } | null {
	const entryId = asText(column(row, 'Entry ID', 'ID'));
	const title = asText(column(row, 'Entry'));
	if (!entryId && !title) return null;

	const year = numberOrNull(column(row, 'Season'));
	const publication = asText(column(row, 'Publication'));
	const company = asText(column(row, 'Company publication'));
	const parent = column(row, 'Parent category');
	const category = column(row, 'Category');
	const classified = classifyCategory({
		year,
		parent,
		category,
		platform: column(row, 'Platform'),
		printOptions: column(row, 'Print options')
	});
	const student = classified.student || checked(column(row, 'Student or school publication'));
	const links = publicLinks(row);
	const fileAssets = fileLocators(row);
	const sourceKey = awardForceKey(entryId || title);
	const assets = [...links, ...fileAssets].map((asset, index) => ({
		...asset,
		sourceKey,
		origin,
		sortOrder: index
	}));

	const record = finishRecord({
		sourceKey,
		source: 'award-force',
		origin,
		year,
		contest: asText(column(row, 'Contest')) || null,
		title,
		publication: publication || company,
		companyPublication: company || null,
		awards: parseAwards(column(row, 'Tags')),
		description: textOrNull(column(row, 'Descrip')),
		citation: textOrNull(column(row, "World's Best description")),
		url: links.find((link) => link.kind === 'url')?.locator ?? null,
		credits: parseCreditLine(column(row, 'Credits')),
		country: textOrNull(column(row, 'Country')),
		orgSize: textOrNull(column(row, 'Org size')),
		emergingDesigner: checked(column(row, 'Emerging designer')),
		entryStatus: textOrNull(column(row, 'Entry status')),
		moderationStatus: textOrNull(column(row, 'Moderation status')),
		...applyClassification({ ...classified, student })
	});

	return { record, assets };
}

export function awardForceKey(entryId: string) {
	return `af-${entryId.trim()}`;
}

function publicLinks(
	row: Record<string, unknown>
): Omit<SourceAsset, 'sourceKey' | 'origin' | 'sortOrder'>[] {
	const assets: Omit<SourceAsset, 'sourceKey' | 'origin' | 'sortOrder'>[] = [];
	for (const [key, value] of Object.entries(row)) {
		if (!/url/i.test(key) || isSecretColumn(key)) continue;
		const url = asUrl(value);
		if (!url) continue;
		assets.push({
			kind: 'url',
			label: key,
			filename: null,
			mediaType: null,
			byteSize: null,
			locator: url,
			expiresHours: null
		});
	}
	return assets;
}

function fileLocators(
	row: Record<string, unknown>
): Omit<SourceAsset, 'sourceKey' | 'origin' | 'sortOrder'>[] {
	const assets: Omit<SourceAsset, 'sourceKey' | 'origin' | 'sortOrder'>[] = [];
	for (const [key, value] of Object.entries(row)) {
		if (!/attachment|preview|^pdf/i.test(key) || isSecretColumn(key)) continue;
		const locator = asText(value);
		if (isBlank(locator) || /^https?:\/\//i.test(locator)) continue;
		assets.push({
			kind: 'award-force-file',
			label: key,
			filename: null,
			mediaType: null,
			byteSize: null,
			locator,
			expiresHours: null
		});
	}
	return assets;
}

function isSecretColumn(name: string) {
	const normalized = name.toLowerCase().replace(/#\d+$/, '').trim();
	return SECRET.test(normalized) || SECRET_NAMES.has(normalized);
}

function textOrNull(value: unknown) {
	const text = asText(value);
	return isBlank(text) ? null : text;
}

function numberOrNull(value: unknown) {
	const text = asText(value);
	const year = Number(text);
	return Number.isInteger(year) && year > 1900 ? year : null;
}
