import { readFileSync } from 'node:fs';
import { parseCsv } from '../src/lib/catalog/parse-csv.ts';
import { pgSql } from '../src/lib/catalog/persist/pg.ts';
import {
	assignmentChanged,
	buildReassignment,
	classificationKey,
	type Assignment,
	type MappingSource,
	type StoredClass
} from '../src/lib/catalog/reassign.ts';

/**
 * Rewrite category, subcategory, discipline, topic, and platform from
 * data/category-mapping-assigned.csv and data/platform-fixes.csv.
 *
 * A stored class with more than one proposal is skipped. The entry does not
 * record which sheet line it came from, so picking one would be a guess.
 *
 *   npx tsx scripts/apply-category-mapping.ts           # counts only
 *   npx tsx scripts/apply-category-mapping.ts --apply   # write
 */

const apply = process.argv.includes('--apply');
const url = process.env.CATALOG_URL || process.env.DATABASE_URL;
if (!url || !/^postgres(ql)?:\/\//.test(url)) {
	throw new Error('Set CATALOG_URL or DATABASE_URL to a postgres:// connection string.');
}

const mapping = parseCsv(readFileSync('data/category-mapping-assigned.csv', 'utf8')).map(
	(row): MappingSource => ({
		rowKey: row.row_key,
		entryCount: Number(row.entry_count) || 0,
		year: row.year,
		currentCategory: row.current_category,
		currentSubcategory: row.current_subcategory,
		currentDiscipline: row.current_discipline,
		currentPlatform: row.current_platform,
		proposedCategory: row.proposed_category,
		proposedSubcategory: row.proposed_subcategory,
		proposedTopic: row.proposed_topic,
		proposedDiscipline: row.proposed_discipline
	})
);
const platforms = new Map(
	parseCsv(readFileSync('data/platform-fixes.csv', 'utf8')).map((row) => [
		row.row_key,
		row.suggested_platform
	])
);
const plan = buildReassignment(mapping, platforms);

type Row = StoredClass & { id: string };
const sql = pgSql(url);
const entries = await sql.query<Row>(
	`SELECT id, year, category, subcategory, discipline, platform, topic FROM entries`
);

const conflictKeys = new Set(plan.conflicts.map((conflict) => conflict.key));
let changes = 0;
let unchanged = 0;
let conflict = 0;
let unmatched = 0;
const writes: { id: string; next: Assignment }[] = [];

for (const entry of entries) {
	const key = classificationKey(entry);
	if (conflictKeys.has(key)) {
		conflict += 1;
		continue;
	}
	const next = plan.assignments.get(key);
	if (!next) {
		unmatched += 1;
		continue;
	}
	if (!assignmentChanged(entry, next)) {
		unchanged += 1;
		continue;
	}
	changes += 1;
	writes.push({ id: entry.id, next });
}

const summary = {
	entries: entries.length,
	assignments: plan.assignments.size,
	conflictClasses: plan.conflicts.length,
	changes,
	unchanged,
	conflict,
	unmatched,
	apply
};
console.log(JSON.stringify(summary, null, 2));

if (!apply) {
	console.log('Dry run. Pass --apply to write these changes.');
	process.exit(0);
}

// A key mismatch would rewrite nothing useful, or rewrite the wrong slice.
// Refuse when most rows are not in the sheet at all.
if (entries.length && unmatched > entries.length / 2) {
	throw new Error(
		`Refusing to write: ${unmatched} of ${entries.length} entries are not in the mapping.`
	);
}

await sql.exec('BEGIN');
try {
	for (const write of writes) {
		await sql.query(
			`UPDATE entries
			 SET category = $2, subcategory = $3, discipline = $4, platform = $5, topic = $6
			 WHERE id = $1`,
			[
				write.id,
				write.next.category,
				write.next.subcategory,
				write.next.discipline,
				write.next.platform,
				write.next.topic
			]
		);
	}
	await sql.exec('COMMIT');
} catch (error) {
	await sql.exec('ROLLBACK');
	throw error;
}
console.log(`Updated ${writes.length} entries.`);
