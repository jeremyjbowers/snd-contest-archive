/** Season year for contest book N (SND47 → 2025). */
export function contestSeasonYear(contest: number): number {
	return 1978 + contest;
}

export function formatYearRange(years: number[]): string {
	const sorted = [...years].sort((a, b) => a - b);
	if (!sorted.length) return '';
	if (sorted.length === 1) return String(sorted[0]);
	return `${sorted[0]}–${sorted[sorted.length - 1]}`;
}

/** Human sheet name for admin filters; `source` stays the raw inventory key. */
export function formatSourceLabel(source: string, years: number[]): string {
	const range = formatYearRange(years);

	const snd = source.match(/^SND(\d+)\s+(print|Results)$/i);
	if (snd) {
		const n = snd[1];
		const kind = snd[2].toLowerCase();
		const year = years[0] ?? contestSeasonYear(Number(n));
		return `SND ${n} ${kind} (${year})`;
	}

	if (source === 'Archive') {
		return range ? `Archive (${range})` : 'Archive';
	}

	if (/^\d{4}$/.test(source)) {
		return range ? `${source} digital (${range})` : `${source} digital`;
	}

	if (source.endsWith(' digital')) {
		return range ? `${source} (${range})` : source;
	}

	return range ? `${source} (${range})` : source;
}

export function yearsBySource<T extends { source: string; year: number | null }>(
	rows: T[]
): Map<string, number[]> {
	const sets = new Map<string, Set<number>>();
	for (const row of rows) {
		if (row.year == null) continue;
		const set = sets.get(row.source) ?? new Set<number>();
		set.add(row.year);
		sets.set(row.source, set);
	}
	const out = new Map<string, number[]>();
	for (const [source, set] of sets) {
		out.set(source, [...set].sort((a, b) => a - b));
	}
	return out;
}
