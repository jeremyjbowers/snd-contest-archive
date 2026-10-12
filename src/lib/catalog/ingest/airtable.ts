import { parseAwards } from './awards';
import { tableDecision } from './airtable-tables';
import { classifyCategory } from './categories';
import { parseCreditLine } from './credits';
import { awardForceKey } from './award-force';
import {
	applyClassification,
	finishRecord,
	type SourceAsset,
	type SubmissionRecord
} from './record';
import { asText, asUrl, column, isBlank } from './text';

export type AirtableDump = {
	baseName: string;
	tableName: string;
	records: AirtableRecord[];
};

export type AirtableRecord = {
	id: string;
	fields: Record<string, unknown>;
};

export function fromAirtableDump(
	dump: AirtableDump,
	options: { includeOverlaps?: boolean } = {}
): { records: SubmissionRecord[]; assets: SourceAsset[]; skipped?: string } {
	const decision = tableDecision(dump.tableName, dump.baseName);
	if (decision.hardRefuse || (!decision.load && !options.includeOverlaps)) {
		return { records: [], assets: [], skipped: `${dump.tableName}: ${decision.reason}` };
	}
	const origin = `airtable:${dump.baseName}/${dump.tableName}`;
	const records: SubmissionRecord[] = [];
	const assets: SourceAsset[] = [];
	for (const record of dump.records) {
		const built = fromAirtableRecord(record, dump, decision.year, decision.platformDefault, origin);
		if (!built) continue;
		records.push(built.record);
		assets.push(...built.assets);
	}
	return { records, assets };
}

/** Map an MCP record that is keyed by field id onto field names. */
export function fieldsByName(
	cellValuesByFieldId: Record<string, unknown>,
	idToName: Record<string, string>
): Record<string, unknown> {
	const fields: Record<string, unknown> = {};
	for (const [id, value] of Object.entries(cellValuesByFieldId)) {
		fields[idToName[id] ?? id] = value;
	}
	return fields;
}

function fromAirtableRecord(
	record: AirtableRecord,
	dump: AirtableDump,
	tableYear: number | null,
	platformDefault: string | null,
	origin: string
): { record: SubmissionRecord; assets: SourceAsset[] } | null {
	const fields = record.fields;
	const title = airtableTitle(fields);
	if (!title) return null;

	const entryId = asText(column(fields, 'Entry ID'));
	const publication = asText(column(fields, 'Publication'));
	const company = asText(column(fields, 'Company Publication', 'Company publication'));
	const year = tableYear ?? yearFromFields(fields);
	const classified = classifyCategory({
		year,
		parent: column(fields, 'Parent category', 'Parent Category', 'General Category Name'),
		category: column(
			fields,
			'Category',
			'Specific Category Name',
			'Specific Category',
			'General Category Name'
		),
		subcategory: column(fields, 'Subcategory'),
		platform: column(fields, 'Platform', 'Platform - all'),
		platformDefault
	});
	const links = linkAssets(fields);
	const sourceKey = entryId ? awardForceKey(entryId) : `at-${record.id}`;
	const assets = links.map((asset, index) => ({ ...asset, sourceKey, origin, sortOrder: index }));
	const citation = textOrNull(column(fields, 'Medal Notes', 'Judges Comments', 'Citation'));

	return {
		assets,
		record: finishRecord({
			sourceKey,
			source: 'airtable',
			origin,
			year,
			contest: contestFromTable(dump.tableName),
			title,
			publication: publication || company,
			companyPublication: company || null,
			awards: parseAwards(column(fields, 'Award')),
			description: null,
			citation,
			url: links.find((link) => link.kind === 'url')?.locator ?? null,
			credits: creditsFrom(fields),
			country: textOrNull(column(fields, 'Country', 'Country2')),
			orgSize: null,
			emergingDesigner: false,
			entryStatus: null,
			moderationStatus: null,
			...applyClassification(classified)
		})
	};
}

function airtableTitle(fields: Record<string, unknown>) {
	const headline = asText(column(fields, 'Headline', 'Name'));
	if (headline && !isMarkdownLink(headline)) return headline;
	const entry = asText(column(fields, 'Entry'));
	if (entry && !isMarkdownLink(entry)) return entry;
	return headline;
}

function isMarkdownLink(value: string) {
	return /^\[[^\]]+\]\(https?:\/\//.test(value);
}

function yearFromFields(fields: Record<string, unknown>) {
	const published = asText(column(fields, 'Work published in'));
	if (/^\d{4}$/.test(published)) return Number(published);
	for (const key of Object.keys(fields)) {
		if (/^\d{4}$/.test(key) && !isBlank(fields[key])) return Number(key);
	}
	return null;
}

function contestFromTable(tableName: string) {
	const snd = tableName.match(/SND\s*(\d+)/i);
	return snd ? `SND${snd[1]}` : null;
}

function creditsFrom(fields: Record<string, unknown>) {
	const line = parseCreditLine(column(fields, 'Credits'));
	if (line.length) return line;
	const first = asText(column(fields, 'First Name', 'First Name1'));
	const last = asText(column(fields, 'Last Name', 'Last Name1'));
	const name = [first, last].filter(Boolean).join(' ');
	return name ? [{ name, role: '' }] : [];
}

function linkAssets(
	fields: Record<string, unknown>
): Omit<SourceAsset, 'sourceKey' | 'origin' | 'sortOrder'>[] {
	const assets: Omit<SourceAsset, 'sourceKey' | 'origin' | 'sortOrder'>[] = [];
	const seen = new Set<string>();
	for (const [key, value] of Object.entries(fields)) {
		if (!/url/i.test(key)) continue;
		for (const url of urlsIn(value)) {
			if (seen.has(url)) continue;
			seen.add(url);
			assets.push(urlAsset(key, url));
		}
	}
	return assets;
}

function urlsIn(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap((item) => urlsIn(item));
	const url = asUrl(value);
	if (url) return [url];
	const text = asText(value);
	const found = text.match(/https?:\/\/[^\s)]+/g);
	return found ?? [];
}

function urlAsset(
	label: string,
	locator: string
): Omit<SourceAsset, 'sourceKey' | 'origin' | 'sortOrder'> {
	const expiring = /airtableusercontent|awardsplatform/i.test(locator);
	return {
		kind: expiring ? 'expiring-download' : 'url',
		label,
		filename: null,
		mediaType: null,
		byteSize: null,
		locator,
		expiresHours: expiring ? 48 : null
	};
}

function textOrNull(value: unknown) {
	const text = asText(value);
	return isBlank(text) ? null : text;
}
