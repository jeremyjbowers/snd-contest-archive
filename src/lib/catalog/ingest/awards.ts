/**
 * One flag on the card, every honor kept for filters.
 * Capstone honors outrank medals so a Gold + World's Best row shows World's Best
 * and still matches a Gold filter.
 */
const RANK = [
	"World's Best",
	"World's Best Designer",
	"World's Best Emerging Designer",
	'Best in Show',
	'Gold',
	'Silver',
	'Bronze',
	'Award of Excellence',
	"Judge's Special Recognition",
	"World's Best Designed Finalist"
] as const;

const ALIASES: Record<string, (typeof RANK)[number]> = {
	"world's best": "World's Best",
	'worlds best': "World's Best",
	"world's best designed": "World's Best",
	'worlds best designed': "World's Best",
	"world's best-designed": "World's Best",
	'worlds best-designed': "World's Best",
	"world's best designer": "World's Best Designer",
	'worlds best designer': "World's Best Designer",
	"world's best emerging designer": "World's Best Emerging Designer",
	'worlds best emerging designer': "World's Best Emerging Designer",
	"world's best designed finalist": "World's Best Designed Finalist",
	'worlds best designed finalist': "World's Best Designed Finalist",
	'best in show': 'Best in Show',
	gold: 'Gold',
	silver: 'Silver',
	bronze: 'Bronze',
	aoe: 'Award of Excellence',
	'award of excellence': 'Award of Excellence',
	"judge's special recognition": "Judge's Special Recognition",
	'judges special recognition': "Judge's Special Recognition"
};

function awardKey(value: string) {
	return value.toLowerCase().replace(/™/g, '').replace(/['’]/g, '').replace(/\s+/g, ' ').trim();
}

function canonicalOne(value: string): string | null {
	return ALIASES[awardKey(value)] ?? null;
}

/** Map tags, select values, or a comma-separated cell onto canonical award names. */
export function parseAwards(value: unknown): string[] {
	const parts = Array.isArray(value) ? value : [value];
	const found = new Set<string>();
	for (const part of parts) {
		const text = typeof part === 'string' ? part : textOf(part);
		if (!text.trim()) continue;
		const whole = canonicalOne(text);
		const tokens = whole ? [whole] : text.split(',').map((token) => canonicalOne(token.trim()));
		for (const token of tokens) {
			if (token) found.add(token);
		}
	}
	return [...found].sort((a, b) => rank(a) - rank(b));
}

function textOf(value: unknown): string {
	if (value && typeof value === 'object' && 'name' in value) {
		return String((value as { name: unknown }).name ?? '');
	}
	return typeof value === 'string' ? value : '';
}

function rank(award: string) {
	const index = RANK.indexOf(award as (typeof RANK)[number]);
	return index === -1 ? RANK.length : index;
}

export function primaryAward(awards: string[]): string {
	return awards[0] ?? '';
}
