import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Entry } from '../types';
import {
	combineRecords,
	mergeRecords,
	toEntry,
	type SourceAsset,
	type SubmissionRecord
} from '../ingest/record';
import { applySchema, type Sql } from './sql';

const SCHEMA_PATH = resolve(process.cwd(), 'data/postgres.sql');

export type StoredMedia = {
	sourceKey: string;
	sortOrder: number;
	mediaType: string;
	bytes: Uint8Array;
};

export async function loadCatalog(
	sql: Sql,
	batch: { records: SubmissionRecord[]; assets: SourceAsset[]; media?: StoredMedia[] },
	schema = readFileSync(SCHEMA_PATH, 'utf8')
) {
	await applySchema(sql, schema);
	const merged = await mergeWithStored(sql, combineRecords(batch.records));
	const origins = [...new Set(batch.assets.map((asset) => asset.origin))];
	const assetsByKey = groupAssets(batch.assets);

	await sql.exec('BEGIN');
	try {
		for (const record of merged) {
			await upsertSubmission(sql, record);
			const entry = toEntry(record, assetsByKey.get(record.sourceKey) ?? []);
			if (entry) await upsertEntry(sql, entry, record);
			else await deleteEntry(sql, record.sourceKey);
		}
		for (const origin of origins) {
			await sql.query('DELETE FROM source_assets WHERE origin = $1', [origin]);
		}
		for (const asset of batch.assets) {
			await sql.query(
				`INSERT INTO source_assets (
					source_key, origin, sort_order, kind, label, filename, media_type, byte_size, locator, expires_hours
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
				[
					asset.sourceKey,
					asset.origin,
					asset.sortOrder,
					asset.kind,
					asset.label,
					asset.filename,
					asset.mediaType,
					asset.byteSize,
					asset.locator,
					asset.expiresHours
				]
			);
		}
		await sql.exec('COMMIT');
	} catch (error) {
		await sql.exec('ROLLBACK');
		throw error;
	}

	const promoted = new Set(
		merged.filter((record) => !record.blockReason).map((record) => record.sourceKey)
	);
	await writeMedia(
		sql,
		(batch.media ?? []).filter((item) => promoted.has(item.sourceKey))
	);

	return {
		submissions: merged.length,
		promoted: merged.filter((record) => !record.blockReason).length
	};
}

async function mergeWithStored(sql: Sql, records: SubmissionRecord[]) {
	const stored = new Map<string, SubmissionRecord>();
	for (const chunk of chunks(
		records.map((record) => record.sourceKey),
		200
	)) {
		const placeholders = chunk.map((_, index) => `$${index + 1}`).join(', ');
		const rows = await sql.query<{ source_key: string; payload: string }>(
			`SELECT source_key, payload FROM source_submissions WHERE source_key IN (${placeholders})`,
			chunk
		);
		for (const row of rows) {
			stored.set(row.source_key, JSON.parse(row.payload) as SubmissionRecord);
		}
	}
	return records.map((record) => {
		const existing = stored.get(record.sourceKey);
		return existing ? mergeRecords(existing, record) : record;
	});
}

async function upsertSubmission(sql: Sql, record: SubmissionRecord) {
	await sql.query(
		`INSERT INTO source_submissions (
			source_key, source, origin, season, contest, entry_status, moderation_status,
			promotable, block_reason, payload, loaded_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		ON CONFLICT (source_key) DO UPDATE SET
			source = EXCLUDED.source,
			origin = EXCLUDED.origin,
			season = EXCLUDED.season,
			contest = EXCLUDED.contest,
			entry_status = EXCLUDED.entry_status,
			moderation_status = EXCLUDED.moderation_status,
			promotable = EXCLUDED.promotable,
			block_reason = EXCLUDED.block_reason,
			payload = EXCLUDED.payload,
			loaded_at = EXCLUDED.loaded_at`,
		[
			record.sourceKey,
			record.source,
			record.origin,
			record.year,
			record.contest,
			record.entryStatus,
			record.moderationStatus,
			record.blockReason ? 0 : 1,
			record.blockReason,
			JSON.stringify(record),
			new Date().toISOString()
		]
	);
}

async function upsertEntry(sql: Sql, entry: Entry, record: SubmissionRecord) {
	await sql.query(
		`INSERT INTO entries (
			id, title, publication, year, award, category, subcategory, discipline, platform, topic,
			description, url, thumbnail, student, non_editorial, multi_winner, access, awards, citation,
			source, source_key
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
		)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			publication = EXCLUDED.publication,
			year = EXCLUDED.year,
			award = EXCLUDED.award,
			category = EXCLUDED.category,
			subcategory = EXCLUDED.subcategory,
			discipline = EXCLUDED.discipline,
			platform = EXCLUDED.platform,
			topic = EXCLUDED.topic,
			description = EXCLUDED.description,
			url = EXCLUDED.url,
			thumbnail = CASE WHEN EXCLUDED.thumbnail = '' THEN entries.thumbnail ELSE EXCLUDED.thumbnail END,
			student = EXCLUDED.student,
			non_editorial = EXCLUDED.non_editorial,
			multi_winner = EXCLUDED.multi_winner,
			access = EXCLUDED.access,
			awards = EXCLUDED.awards,
			citation = EXCLUDED.citation,
			source = EXCLUDED.source,
			source_key = EXCLUDED.source_key`,
		[
			entry.id,
			entry.title,
			entry.publication,
			entry.year,
			entry.award,
			entry.category,
			entry.subcategory,
			entry.discipline,
			entry.platform,
			entry.topic,
			entry.description,
			entry.url,
			entry.thumbnail,
			entry.student ? 1 : 0,
			entry.nonEditorial ? 1 : 0,
			entry.multiWinner ? 1 : 0,
			entry.access,
			JSON.stringify(entry.awards),
			entry.citation,
			record.source,
			record.sourceKey
		]
	);
	await sql.query('DELETE FROM credits WHERE entry_id = $1', [entry.id]);
	// A later load that has no pictures (Award Force rows, for example) must not
	// wipe previews already stored from the results sheet.
	if (entry.images.length) {
		await sql.query('DELETE FROM entry_images WHERE entry_id = $1', [entry.id]);
		await sql.query('DELETE FROM entry_media WHERE entry_id = $1', [entry.id]);
		for (const [index, url] of entry.images.entries()) {
			await sql.query('INSERT INTO entry_images (entry_id, url, sort_order) VALUES ($1, $2, $3)', [
				entry.id,
				url,
				index
			]);
		}
	}
	for (const [index, credit] of entry.credits.entries()) {
		await sql.query(
			'INSERT INTO credits (entry_id, name, role, sort_order) VALUES ($1, $2, $3, $4)',
			[entry.id, credit.name, credit.role, index]
		);
	}
}

async function deleteEntry(sql: Sql, id: string) {
	await sql.query('DELETE FROM entry_images WHERE entry_id = $1', [id]);
	await sql.query('DELETE FROM entry_media WHERE entry_id = $1', [id]);
	await sql.query('DELETE FROM credits WHERE entry_id = $1', [id]);
	await sql.query('DELETE FROM entries WHERE id = $1', [id]);
}

async function writeMedia(sql: Sql, media: StoredMedia[]) {
	for (const item of media) {
		await sql.query(
			`INSERT INTO entry_media (entry_id, sort_order, media_type, bytes)
			 VALUES ($1, $2, $3, $4)`,
			[item.sourceKey, item.sortOrder, item.mediaType, item.bytes]
		);
	}
}

function groupAssets(assets: SourceAsset[]) {
	const grouped = new Map<string, SourceAsset[]>();
	for (const asset of assets) {
		const list = grouped.get(asset.sourceKey) ?? [];
		list.push(asset);
		grouped.set(asset.sourceKey, list);
	}
	return grouped;
}

function chunks<T>(values: T[], size: number) {
	const groups: T[][] = [];
	for (let index = 0; index < values.length; index += size) {
		groups.push(values.slice(index, index + size));
	}
	return groups;
}
