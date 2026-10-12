import { CANONICAL_FACETS } from '../types';
import type { SourceAsset, SubmissionRecord } from './record';

export type ModelFit = {
	records: number;
	promotable: number;
	withAwards: number;
	blocked: Record<string, number>;
	years: Record<string, number>;
	awards: Record<string, number>;
	disciplines: Record<string, number>;
	platforms: Record<string, number>;
	outsideCanonical: {
		awards: string[];
		disciplines: string[];
		platforms: string[];
	};
	missingOnPromotable: {
		description: number;
		citation: number;
		credits: number;
		url: number;
		category: number;
		disciplineFallback: number;
	};
	assets: {
		total: number;
		expiring: number;
		articleLinks: number;
		fileIds: number;
	};
};

/** Summarize how source rows sit on the catalog Entry model. */
export function modelFit(records: SubmissionRecord[], assets: SourceAsset[] = []): ModelFit {
	const blocked: Record<string, number> = {};
	const years: Record<string, number> = {};
	const awards: Record<string, number> = {};
	const disciplines: Record<string, number> = {};
	const platforms: Record<string, number> = {};
	const missing = {
		description: 0,
		citation: 0,
		credits: 0,
		url: 0,
		category: 0,
		disciplineFallback: 0
	};
	let promotable = 0;
	let withAwards = 0;

	for (const record of records) {
		if (record.awards.length) withAwards += 1;
		const year = record.year == null ? 'unknown' : String(record.year);
		years[year] = (years[year] ?? 0) + 1;
		if (record.blockReason) {
			blocked[record.blockReason] = (blocked[record.blockReason] ?? 0) + 1;
			continue;
		}
		promotable += 1;
		for (const award of record.awards) awards[award] = (awards[award] ?? 0) + 1;
		disciplines[record.discipline] = (disciplines[record.discipline] ?? 0) + 1;
		platforms[record.platform] = (platforms[record.platform] ?? 0) + 1;
		if (!record.description) missing.description += 1;
		if (!record.citation) missing.citation += 1;
		if (!record.credits.length) missing.credits += 1;
		if (!record.url) missing.url += 1;
		if (record.category === 'Uncategorized') missing.category += 1;
		if (record.usedFallbackDiscipline) missing.disciplineFallback += 1;
	}

	return {
		records: records.length,
		promotable,
		withAwards,
		blocked,
		years,
		awards,
		disciplines,
		platforms,
		outsideCanonical: {
			awards: outside(awards, CANONICAL_FACETS.awards),
			disciplines: outside(disciplines, CANONICAL_FACETS.disciplines),
			platforms: outside(platforms, CANONICAL_FACETS.platforms)
		},
		missingOnPromotable: missing,
		assets: {
			total: assets.length,
			expiring: assets.filter((asset) => asset.kind === 'expiring-download').length,
			articleLinks: assets.filter((asset) => asset.kind === 'url').length,
			fileIds: assets.filter((asset) => asset.kind === 'award-force-file').length
		}
	};
}

function outside(counts: Record<string, number>, canonical: readonly string[]) {
	const allowed = new Set<string>(canonical);
	return Object.keys(counts)
		.filter((value) => !allowed.has(value))
		.sort();
}
