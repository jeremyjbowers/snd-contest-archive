export type TableDecision = {
	load: boolean;
	hardRefuse: boolean;
	year: number | null;
	platformDefault: string | null;
	reason: string;
};

/** SND46 is the 2024 season, so contest number N is year 1978 + N. */
export function yearFromContest(contestNumber: number) {
	return 1978 + contestNumber;
}

/**
 * Which Airtable tables are archive rows, and which are rosters, scratch
 * space, or rollups that would double-count winners.
 */
export function tableDecision(tableName: string, baseName = ''): TableDecision {
	const name = tableName.trim();
	const base = baseName.toLowerCase();

	if (/people|committee|logistics/i.test(name)) {
		return refuse(true, 'Roster table. It holds contact details and is not archive data.');
	}
	if (/^zz/i.test(name) || /test awardforce/i.test(name)) {
		return refuse(true, 'Scratch or API test table.');
	}
	if (/medal discussion/i.test(name)) {
		return refuse(false, 'Working copy of a results table. Load the Results table instead.');
	}
	if (/dashboard|capstone|call for entries|audit\/judging|categories$/i.test(name)) {
		return refuse(false, 'Judging operations, not winning entries.');
	}
	if (/publications$/i.test(name)) {
		return refuse(false, 'Publication rollup, not entries.');
	}
	if (/^archive$/i.test(name) || /world's best winners/i.test(name)) {
		return {
			load: false,
			hardRefuse: false,
			year: null,
			platformDefault: 'Digital',
			reason: 'Overlaps the yearly tables. Pass --include-overlaps to load it anyway.'
		};
	}

	const snd = name.match(/SND\s*(\d+)/i);
	const leadingYear = name.match(/^(\d{4})\b/);
	const year = leadingYear ? Number(leadingYear[1]) : snd ? yearFromContest(Number(snd[1])) : null;
	const platformDefault =
		/print results/i.test(name) || (/print/i.test(base) && /^SND4[2-5]$/i.test(name))
			? 'Print'
			: /digital/i.test(base) && leadingYear
				? 'Digital'
				: null;

	return {
		load: true,
		hardRefuse: false,
		year,
		platformDefault,
		reason: ''
	};
}

function refuse(hardRefuse: boolean, reason: string): TableDecision {
	return { load: false, hardRefuse, year: null, platformDefault: null, reason };
}
