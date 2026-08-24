import {
	CANONICAL_FACETS,
	type Entry,
	type EntryQuery,
	type EntrySummary,
	type Facets
} from './types';

export function emptyQuery(): EntryQuery {
	return {
		disciplines: [],
		awards: [],
		platforms: [],
		organizations: [],
		topics: [],
		categories: [],
		special: []
	};
}

export function toSummary(entry: Entry): EntrySummary {
	const { images, ...summary } = entry;
	return {
		id: summary.id,
		title: summary.title,
		publication: summary.publication,
		year: summary.year,
		award: summary.award,
		category: summary.category,
		subcategory: summary.subcategory,
		discipline: summary.discipline,
		platform: summary.platform,
		topic: summary.topic,
		thumbnail: summary.thumbnail,
		student: summary.student,
		nonEditorial: summary.nonEditorial,
		multiWinner: summary.multiWinner,
		access: summary.access,
		imageCount: images.length
	};
}

function matchesList(selected: string[] | undefined, value: string) {
	return !selected?.length || selected.includes(value);
}

function blob(entry: Entry) {
	return [
		entry.title,
		entry.publication,
		entry.category,
		entry.subcategory ?? '',
		entry.topic ?? '',
		entry.description ?? '',
		...entry.credits.map((credit) => `${credit.name} ${credit.role}`)
	]
		.join(' ')
		.toLowerCase();
}

export function filterEntries(entries: Entry[], query: Partial<EntryQuery> = {}): Entry[] {
	const q = query.q?.trim().toLowerCase();
	const person = query.person?.trim().toLowerCase();

	return entries.filter((entry) => {
		if (q && !blob(entry).includes(q)) return false;
		if (!matchesList(query.disciplines, entry.discipline)) return false;
		if (!matchesList(query.awards, entry.award)) return false;
		if (!matchesList(query.platforms, entry.platform)) return false;
		if (!matchesList(query.organizations, entry.publication)) return false;
		if (query.topics?.length && (!entry.topic || !query.topics.includes(entry.topic))) return false;
		if (!matchesList(query.categories, entry.category)) return false;
		if (query.yearMin != null && entry.year < query.yearMin) return false;
		if (query.yearMax != null && entry.year > query.yearMax) return false;
		if (person && !entry.credits.some((credit) => credit.name.toLowerCase().includes(person))) {
			return false;
		}
		if (query.special?.length) {
			const ok = query.special.every((flag) => {
				if (flag === 'Student work') return entry.student;
				if (flag === 'Non-editorial') return entry.nonEditorial;
				if (flag === 'Multiple award winners') return entry.multiWinner;
				return true;
			});
			if (!ok) return false;
		}
		return true;
	});
}

function uniqueSorted(values: Array<string | null | undefined>) {
	return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
		a.localeCompare(b)
	);
}

function unionCanonical(canonical: readonly string[], fromData: string[]) {
	const seen = new Set(canonical);
	return [...canonical, ...fromData.filter((value) => !seen.has(value))];
}

export function buildFacets(entries: Entry[]): Facets {
	const years = entries.map((entry) => entry.year);
	return {
		disciplines: unionCanonical(
			CANONICAL_FACETS.disciplines,
			uniqueSorted(entries.map((entry) => entry.discipline))
		),
		awards: unionCanonical(
			CANONICAL_FACETS.awards,
			uniqueSorted(entries.map((entry) => entry.award))
		),
		platforms: unionCanonical(
			CANONICAL_FACETS.platforms,
			uniqueSorted(entries.map((entry) => entry.platform))
		),
		organizations: uniqueSorted(entries.map((entry) => entry.publication)),
		topics: uniqueSorted(entries.map((entry) => entry.topic)),
		categories: uniqueSorted(entries.map((entry) => entry.category)),
		yearMin: years.length ? Math.min(...years) : 1986,
		yearMax: years.length ? Math.max(...years) : new Date().getFullYear()
	};
}
