import type { Credit, Entry } from '../types';
import { primaryAward } from './awards';
import type { ClassifiedCategory } from './categories';

export type SubmissionSource = 'award-force' | 'airtable';

export type SourceAsset = {
	sourceKey: string;
	origin: string;
	sortOrder: number;
	kind: 'url' | 'award-force-file' | 'expiring-download';
	label: string;
	filename: string | null;
	mediaType: string | null;
	byteSize: string | null;
	locator: string;
	expiresHours: number | null;
};

/**
 * One contest row after mapping, before it is written to `entries`.
 * Contact fields and paywall secrets never belong on this object.
 */
export type SubmissionRecord = {
	sourceKey: string;
	source: SubmissionSource;
	origin: string;
	sources: SubmissionSource[];
	judgedBy: SubmissionSource | null;
	year: number | null;
	contest: string | null;
	title: string;
	publication: string;
	companyPublication: string | null;
	awards: string[];
	category: string;
	subcategory: string | null;
	discipline: string;
	platform: string;
	topic: string | null;
	description: string | null;
	citation: string | null;
	url: string | null;
	credits: Credit[];
	student: boolean;
	nonEditorial: boolean;
	country: string | null;
	orgSize: string | null;
	emergingDesigner: boolean;
	entryStatus: string | null;
	moderationStatus: string | null;
	usedFallbackDiscipline: boolean;
	blockReason: string | null;
};

const DURABLE_IMAGE = /\.(png|jpe?g|gif|webp)(\?|$)/i;

export function toEntry(record: SubmissionRecord): Entry | null {
	if (record.blockReason || record.year == null) return null;
	const images = durableImages(record);
	return {
		id: record.sourceKey,
		title: record.title,
		publication: record.publication,
		year: record.year,
		award: primaryAward(record.awards),
		awards: record.awards,
		category: record.category,
		subcategory: record.subcategory,
		discipline: record.discipline,
		platform: record.platform,
		topic: record.topic,
		description: record.description ?? record.citation,
		citation: record.citation,
		url: record.url,
		thumbnail: images[0] ?? '',
		images,
		credits: record.credits,
		student: record.student,
		nonEditorial: record.nonEditorial,
		multiWinner: record.awards.length > 1,
		access: 'public'
	};
}

function durableImages(record: SubmissionRecord): string[] {
	if (!record.url || !DURABLE_IMAGE.test(record.url)) return [];
	return [record.url];
}

export function finishRecord(
	partial: Omit<SubmissionRecord, 'blockReason' | 'judgedBy' | 'sources'> & {
		sources?: SubmissionSource[];
		judgedBy?: SubmissionSource | null;
	}
): SubmissionRecord {
	const sources = partial.sources?.length ? partial.sources : [partial.source];
	const judgedBy =
		partial.judgedBy ??
		(partial.source === 'airtable' && partial.awards.length
			? 'airtable'
			: partial.awards.length
				? 'award-force'
				: null);
	return {
		...partial,
		sources,
		judgedBy,
		blockReason: blockReason(partial, judgedBy)
	};
}

function blockReason(
	record: {
		title: string;
		publication: string;
		year: number | null;
		awards: string[];
		entryStatus: string | null;
		moderationStatus: string | null;
	},
	judgedBy: SubmissionSource | null
): string | null {
	if (!record.title.trim()) return 'missing-title';
	if (!record.publication.trim()) return 'missing-publication';
	if (record.year == null) return 'missing-year';
	if (!record.awards.length) return 'missing-award';
	if (judgedBy !== 'airtable') {
		if (record.entryStatus && !/submitted/i.test(record.entryStatus)) return 'not-submitted';
		if (record.moderationStatus && !/approved/i.test(record.moderationStatus))
			return 'not-approved';
	}
	return null;
}

export function combineRecords(records: SubmissionRecord[]) {
	const byKey = new Map<string, SubmissionRecord>();
	for (const record of records) {
		const existing = byKey.get(record.sourceKey);
		byKey.set(record.sourceKey, existing ? mergeRecords(existing, record) : record);
	}
	return [...byKey.values()];
}

/** Fill gaps. Airtable awards win over Award Force tags when both describe one entry id. */
export function mergeRecords(
	existing: SubmissionRecord,
	incoming: SubmissionRecord
): SubmissionRecord {
	const sources = [...new Set([...existing.sources, ...incoming.sources])];
	const airtableAwards =
		existing.judgedBy === 'airtable' && incoming.source !== 'airtable'
			? existing.awards
			: incoming.awards;
	const awards = airtableAwards.length ? airtableAwards : existing.awards;
	const judgedBy =
		(incoming.source === 'airtable' && incoming.awards.length) || existing.judgedBy === 'airtable'
			? awards.length
				? 'airtable'
				: null
			: awards.length
				? 'award-force'
				: null;

	return finishRecord({
		sourceKey: existing.sourceKey,
		source: incoming.source,
		origin: incoming.origin,
		sources,
		judgedBy,
		year: incoming.year ?? existing.year,
		contest: incoming.contest ?? existing.contest,
		title: incoming.title || existing.title,
		publication: preferPublication(existing, incoming),
		companyPublication: incoming.companyPublication ?? existing.companyPublication,
		awards,
		category: incoming.category || existing.category,
		subcategory: incoming.subcategory ?? existing.subcategory,
		discipline: preferDiscipline(existing.discipline, incoming.discipline),
		platform: preferPlatform(existing.platform, incoming.platform),
		topic: incoming.topic ?? existing.topic,
		description: incoming.description || existing.description,
		citation: incoming.citation || existing.citation,
		url: incoming.url || existing.url,
		credits: incoming.credits.length ? incoming.credits : existing.credits,
		student: existing.student || incoming.student,
		nonEditorial: existing.nonEditorial || incoming.nonEditorial,
		country: incoming.country ?? existing.country,
		orgSize: incoming.orgSize ?? existing.orgSize,
		emergingDesigner: existing.emergingDesigner || incoming.emergingDesigner,
		entryStatus: incoming.entryStatus ?? existing.entryStatus,
		moderationStatus: incoming.moderationStatus ?? existing.moderationStatus,
		usedFallbackDiscipline: incoming.usedFallbackDiscipline && existing.usedFallbackDiscipline
	});
}

function preferPublication(existing: SubmissionRecord, incoming: SubmissionRecord) {
	if (incoming.publication && incoming.publication !== incoming.companyPublication)
		return incoming.publication;
	if (existing.publication) return existing.publication;
	return incoming.publication;
}

function preferPlatform(existing: string, incoming: string) {
	if (incoming && incoming !== 'Other') return incoming;
	return existing || incoming || 'Other';
}

function preferDiscipline(existing: string, incoming: string) {
	return incoming || existing;
}

export function applyClassification(
	classified: ClassifiedCategory
): Pick<
	SubmissionRecord,
	| 'category'
	| 'subcategory'
	| 'discipline'
	| 'platform'
	| 'topic'
	| 'student'
	| 'nonEditorial'
	| 'usedFallbackDiscipline'
> {
	return classified;
}
