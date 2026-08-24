/** One credited person on an entry. */
export type Credit = {
	name: string;
	role: string;
};

/** How a visitor can see this entry. Public is always visible. */
export type Access = 'public' | 'member';

/**
 * A single competition entry.
 *
 * This shape is the contract between every catalog adapter (CSV, SQLite,
 * Postgres) and the Svelte pages. When the real backend lands, keep this
 * type stable and map the new schema into it.
 */
export type Entry = {
	id: string;
	title: string;
	publication: string;
	year: number;
	award: string;
	category: string;
	subcategory: string | null;
	discipline: string;
	platform: string;
	topic: string | null;
	description: string | null;
	url: string | null;
	thumbnail: string;
	images: string[];
	credits: Credit[];
	student: boolean;
	nonEditorial: boolean;
	multiWinner: boolean;
	access: Access;
};

/** Card-sized view of an entry (no long description / image gallery). */
export type EntrySummary = Omit<Entry, 'images' | 'credits' | 'description' | 'url'> & {
	imageCount: number;
};

/** Filters the archive grid understands. Empty arrays mean “no restriction”. */
export type EntryQuery = {
	q?: string;
	disciplines: string[];
	awards: string[];
	platforms: string[];
	organizations: string[];
	topics: string[];
	categories: string[];
	special: string[];
	person?: string;
	yearMin?: number;
	yearMax?: number;
};

/** Distinct values used to build the filter panel. */
export type Facets = {
	disciplines: string[];
	awards: string[];
	platforms: string[];
	organizations: string[];
	topics: string[];
	categories: string[];
	yearMin: number;
	yearMax: number;
};

/**
 * The catalog is the only way pages should load archive data.
 * Swap adapters in `getCatalog()` without touching UI code.
 */
export interface Catalog {
	listEntries(query?: Partial<EntryQuery>): Promise<EntrySummary[]>;
	getEntry(id: string): Promise<Entry | null>;
	getFacets(): Promise<Facets>;
}

export const SPECIAL_FILTERS = ['Student work', 'Non-editorial', 'Multiple award winners'] as const;

export const CANONICAL_FACETS = {
	disciplines: [
		'News design',
		'Infographics',
		'Art direction',
		'Illustration & animation',
		'Product design',
		'Video'
	],
	awards: [
		'Silver',
		'Gold',
		'Bronze',
		'Award of Excellence',
		'Best in Show',
		"Judge's Special Recognition",
		"World's Best"
	],
	platforms: ['Print', 'Digital', 'Social', 'Multiplatform', 'Other']
} as const;
