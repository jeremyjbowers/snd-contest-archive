export type Assignment = {
	category: string;
	subcategory: string | null;
	topic: string | null;
	discipline: string;
	platform: string;
};

export type MappingSource = {
	rowKey: string;
	entryCount: number;
	year: string;
	currentCategory: string;
	currentSubcategory: string;
	currentDiscipline: string;
	currentPlatform: string;
	proposedCategory: string;
	proposedSubcategory: string;
	proposedTopic: string;
	proposedDiscipline: string;
};

export type StoredClass = {
	year: number | string;
	category: string;
	subcategory: string | null;
	discipline: string;
	platform: string;
	topic?: string | null;
};

export type ReassignmentPlan = {
	assignments: Map<string, Assignment>;
	conflicts: { key: string; entryCount: number; proposals: number }[];
};

const SEP = '\u001f';

export function blank(value: string | null | undefined): string {
	return (value ?? '').trim();
}

/** The class an entry is in today: year plus the four stored labels. */
export function classificationKey(entry: StoredClass): string {
	return [
		String(entry.year),
		blank(entry.category),
		blank(entry.subcategory),
		blank(entry.discipline),
		blank(entry.platform)
	].join(SEP);
}

function nullable(value: string): string | null {
	const text = value.trim();
	return text ? text : null;
}

function assignmentOf(row: MappingSource, platform: string): Assignment {
	return {
		category: row.proposedCategory.trim(),
		subcategory: nullable(row.proposedSubcategory),
		topic: nullable(row.proposedTopic),
		discipline: row.proposedDiscipline.trim(),
		platform
	};
}

function sameAssignment(left: Assignment, right: Assignment): boolean {
	return (
		left.category === right.category &&
		left.subcategory === right.subcategory &&
		left.topic === right.topic &&
		left.discipline === right.discipline &&
		left.platform === right.platform
	);
}

/**
 * One proposal per stored class. When the same class maps to two proposals,
 * that class is a conflict and is left out: the entry row does not record
 * which sheet line it came from, so the update would be a guess.
 */
export function buildReassignment(
	rows: MappingSource[],
	platformByRowKey: ReadonlyMap<string, string> = new Map()
): ReassignmentPlan {
	const groups = new Map<string, { entryCount: number; proposals: Map<string, Assignment> }>();
	for (const row of rows) {
		const platform = platformByRowKey.get(row.rowKey) ?? row.currentPlatform;
		const proposed = assignmentOf(row, platform.trim());
		if (!proposed.category || !proposed.discipline) continue;
		const key = classificationKey({
			year: row.year,
			category: row.currentCategory,
			subcategory: row.currentSubcategory,
			discipline: row.currentDiscipline,
			platform: row.currentPlatform
		});
		const group = groups.get(key) ?? { entryCount: 0, proposals: new Map() };
		group.entryCount += row.entryCount;
		group.proposals.set(JSON.stringify(proposed), proposed);
		groups.set(key, group);
	}

	const assignments = new Map<string, Assignment>();
	const conflicts: ReassignmentPlan['conflicts'] = [];
	for (const [key, group] of groups) {
		const proposals = [...group.proposals.values()];
		if (proposals.length === 1) assignments.set(key, proposals[0]);
		else conflicts.push({ key, entryCount: group.entryCount, proposals: proposals.length });
	}
	conflicts.sort((a, b) => b.entryCount - a.entryCount);
	return { assignments, conflicts };
}

export function assignmentChanged(entry: StoredClass, next: Assignment): boolean {
	return !sameAssignment(
		{
			category: blank(entry.category),
			subcategory: nullable(blank(entry.subcategory)),
			topic: nullable(blank(entry.topic)),
			discipline: blank(entry.discipline),
			platform: blank(entry.platform)
		},
		next
	);
}
