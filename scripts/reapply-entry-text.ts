import { isUploadName, type SubmissionRecord } from '../src/lib/catalog/ingest/record.ts';
import { pgSql } from '../src/lib/catalog/persist/pg.ts';

/**
 * Apply the loader's description and citation rules to rows already stored.
 *
 * Description becomes the entrant's text from the submission. It is not
 * filled from the citation. A citation that is an upload filename (the
 * Award Force "World's Best description" column) is cleared and kept as a
 * file locator. Judges' prose is left alone. Category, topic, and the
 * other entry fields are not touched.
 *
 *   npx tsx scripts/reapply-entry-text.ts
 *   npx tsx scripts/reapply-entry-text.ts --apply
 */

const apply = process.argv.includes('--apply');
const url = process.env.CATALOG_URL || process.env.DATABASE_URL;
if (!url || !/^postgres(ql)?:\/\//.test(url)) {
	throw new Error('Set CATALOG_URL or DATABASE_URL to a postgres:// connection string.');
}

const sql = pgSql(url);
const submissions = await sql.query<{ source_key: string; origin: string; payload: string }>(
	'SELECT source_key, origin, payload FROM source_submissions'
);
const entries = await sql.query<{
	id: string;
	description: string | null;
	citation: string | null;
}>('SELECT id, description, citation FROM entries');
const entryById = new Map(entries.map((row) => [row.id, row]));
const existingLocators = new Set(
	(
		await sql.query<{ source_key: string; locator: string }>(
			'SELECT source_key, locator FROM source_assets'
		)
	).map((row) => `${row.source_key}\0${row.locator}`)
);

type Change = {
	id: string;
	description: string | null;
	citation: string | null;
	payload: string | null;
	upload: string | null;
	origin: string;
};

const changes: Change[] = [];
let proseKept = 0;
let uploadCleared = 0;
let descriptionRewritten = 0;
let unchanged = 0;

for (const row of submissions) {
	const record = JSON.parse(row.payload) as SubmissionRecord;
	const upload = isUploadName(record.citation) ? record.citation : null;
	const citation = upload ? null : record.citation;
	const description = record.description;
	if (upload) uploadCleared += 1;
	else if (citation) proseKept += 1;

	const stored = entryById.get(row.source_key);
	const descriptionChanged = stored
		? (stored.description ?? null) !== (description ?? null)
		: false;
	const citationChanged = stored ? (stored.citation ?? null) !== (citation ?? null) : false;
	const payloadChanged = upload != null;
	if (descriptionChanged) descriptionRewritten += 1;
	if (!descriptionChanged && !citationChanged && !payloadChanged) {
		unchanged += 1;
		continue;
	}
	changes.push({
		id: row.source_key,
		description,
		citation,
		payload: payloadChanged ? JSON.stringify({ ...record, citation: null }) : null,
		upload,
		origin: row.origin
	});
}

const summary = {
	apply,
	submissions: submissions.length,
	entries: entries.length,
	unchanged,
	descriptionRewritten,
	uploadCitationsCleared: uploadCleared,
	proseCitationsKept: proseKept,
	rowsToWrite: changes.length
};
console.log(JSON.stringify(summary, null, 2));

if (!apply) {
	console.log('Dry run. Pass --apply to write description and citation.');
	process.exit(0);
}

await sql.exec('BEGIN');
try {
	for (const change of changes) {
		if (entryById.has(change.id)) {
			await sql.query('UPDATE entries SET description = $2, citation = $3 WHERE id = $1', [
				change.id,
				change.description,
				change.citation
			]);
		}
		if (change.payload) {
			await sql.query('UPDATE source_submissions SET payload = $2 WHERE source_key = $1', [
				change.id,
				change.payload
			]);
		}
		if (change.upload && !existingLocators.has(`${change.id}\0${change.upload}`)) {
			const order = await sql.query<{ next: number }>(
				`SELECT coalesce(max(sort_order), -1) + 1 AS next
				 FROM source_assets WHERE source_key = $1 AND origin = $2`,
				[change.id, change.origin]
			);
			await sql.query(
				`INSERT INTO source_assets (
					source_key, origin, sort_order, kind, label, filename, media_type, byte_size, locator, expires_hours
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
				[
					change.id,
					change.origin,
					order[0]?.next ?? 0,
					'award-force-file',
					"World's Best description",
					change.upload.includes('.') ? change.upload : null,
					change.upload.toLowerCase().endsWith('.pdf') ? 'application/pdf' : null,
					null,
					change.upload,
					null
				]
			);
			existingLocators.add(`${change.id}\0${change.upload}`);
		}
	}
	await sql.exec('COMMIT');
} catch (error) {
	await sql.exec('ROLLBACK');
	throw error;
}

console.log(JSON.stringify({ wrote: changes.length }, null, 2));
process.exit(0);
