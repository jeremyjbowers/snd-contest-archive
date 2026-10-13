import {
	closeSync,
	mkdirSync,
	openSync,
	readFileSync,
	readSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { resolve } from 'node:path';
import { fromAirtableDump, type AirtableDump } from '../src/lib/catalog/ingest/airtable.ts';
import { asStoredImage, isDurableImage, sniffImage } from '../src/lib/catalog/ingest/images.ts';
import { modelFit } from '../src/lib/catalog/ingest/model-fit.ts';
import {
	combineRecords,
	type SourceAsset,
	type SubmissionRecord
} from '../src/lib/catalog/ingest/record.ts';
import { loadCatalog, type StoredMedia } from '../src/lib/catalog/persist/load.ts';
import { pgSql } from '../src/lib/catalog/persist/pg.ts';

/**
 * Load SND Results sheets into Postgres and mirror attachment previews.
 *
 * Airtable file URLs expire, so each preview is downloaded and stored in
 * entry_media. The site serves it from /media/{id}/{index}.
 *
 *   npx tsx scripts/load-results-sheet.ts --database "$CATALOG_URL" \
 *     --cache /tmp/snd-media snd46.json snd47.json
 */

const MAX_BYTES = 12_000_000;
const options = parseArgs(process.argv.slice(2));
const database = options.database || process.env.CATALOG_URL || process.env.DATABASE_URL;
if (!options.mirrorOnly && !database) throw new Error('Pass --database postgres://...');

const loaded = readDumps(options.dumps);
const records = combineRecords(loaded.records);
console.log(
	`Read ${records.length} results rows, ${loaded.assets.length} assets, from ${options.dumps.length} dumps`
);
const mirrored = await mirrorPreviews(loaded.assets, options.cache);
if (options.mirrorOnly) process.exit(0);
if (!database) throw new Error('Pass --database postgres://...');
const result = await loadCatalog(pgSql(database), {
	records,
	assets: mirrored.assets,
	media: mirrored.media
});
await insertCachedMedia(database, mirrored.assets, options.cache);
const fit = modelFit(records, mirrored.assets);
console.log(
	JSON.stringify(
		{
			...result,
			years: fit.years,
			previews: mirrored.assets.filter(isDurableImage).length
		},
		null,
		2
	)
);

async function insertCachedMedia(database: string, assets: SourceAsset[], cacheDir: string) {
	const sql = pgSql(database);
	const present = new Set(
		(await sql.query<{ id: string }>('SELECT id FROM entries')).map((row) => row.id)
	);
	const images = assets.filter((asset) => isDurableImage(asset) && present.has(asset.sourceKey));
	let stored = 0;
	let skipped = 0;
	for (const asset of images) {
		const match = asset.locator.match(/\/media\/([^/]+)\/(\d+)$/);
		if (!match) continue;
		const sourceKey = decodeURIComponent(match[1]);
		const sortOrder = Number(match[2]);
		const existing = await sql.query(
			'SELECT 1 AS ok FROM entry_media WHERE entry_id = $1 AND sort_order = $2',
			[sourceKey, sortOrder]
		);
		if (existing.length) {
			skipped += 1;
			continue;
		}
		const bytes = new Uint8Array(readFileSync(resolve(cacheDir, `${sourceKey}-${sortOrder}`)));
		await sql.query(
			`INSERT INTO entry_media (entry_id, sort_order, media_type, bytes)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (entry_id, sort_order) DO NOTHING`,
			[sourceKey, sortOrder, asset.mediaType, bytes]
		);
		stored += 1;
		if ((stored + skipped) % 200 === 0) {
			console.log(`stored ${stored}, already there ${skipped}, of ${images.length}`);
		}
	}
	console.log(`stored ${stored} previews, skipped ${skipped} already stored`);
}

function readDumps(files: string[]) {
	const records: SubmissionRecord[] = [];
	const assets: SourceAsset[] = [];
	for (const filePath of files) {
		const dump = JSON.parse(readFileSync(filePath, 'utf8')) as AirtableDump;
		if (!dump.tableName || !Array.isArray(dump.records)) {
			throw new Error(`${filePath} is not an Airtable dump`);
		}
		const mapped = fromAirtableDump(dump);
		if (mapped.skipped) console.error(mapped.skipped);
		records.push(...mapped.records);
		assets.push(...mapped.assets);
	}
	return { records, assets };
}

async function mirrorPreviews(assets: SourceAsset[], cacheDir: string) {
	mkdirSync(cacheDir, { recursive: true });
	const targets = assets.filter(
		(asset) => asset.kind === 'expiring-download' && asset.label === 'Attachment'
	);
	const stored = new Map<string, SourceAsset>();
	let finished = 0;
	await runPool(targets, 8, async (asset) => {
		const key = `${asset.sourceKey}:${asset.sortOrder}`;
		const filePath = resolve(cacheDir, `${asset.sourceKey}-${asset.sortOrder}`);
		const mediaType = await cachedImage(filePath, asset.locator);
		finished += 1;
		if (finished % 200 === 0) console.log(`mirrored ${finished}/${targets.length}`);
		if (!mediaType) return;
		stored.set(key, asStoredImage(asset, { mediaType }));
	});
	console.log(`kept ${stored.size} previews on disk`);
	return {
		media: [] as StoredMedia[],
		assets: assets.map((asset) => stored.get(`${asset.sourceKey}:${asset.sortOrder}`) ?? asset)
	};
}

async function cachedImage(filePath: string, url: string) {
	const cachedType = sniffCached(filePath);
	if (cachedType) return cachedType;
	const bytes = await fetchImage(url);
	if (!bytes) return null;
	const mediaType = sniffImage(bytes);
	if (!mediaType) return null;
	writeFileSync(filePath, bytes);
	return mediaType;
}

function sniffCached(filePath: string) {
	let fd: number | null = null;
	try {
		const size = statSync(filePath).size;
		if (size < 16) return null;
		fd = openSync(filePath, 'r');
		const header = new Uint8Array(16);
		readSync(fd, header, 0, 16, 0);
		return sniffImage(header);
	} catch {
		return null;
	} finally {
		if (fd != null) closeSync(fd);
	}
}

async function fetchImage(url: string) {
	for (let attempt = 0; attempt < 4; attempt += 1) {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
			if (response.status === 429 || response.status >= 500) {
				await wait(1000 * (attempt + 1));
				continue;
			}
			if (!response.ok) return null;
			const bytes = new Uint8Array(await response.arrayBuffer());
			if (bytes.byteLength > MAX_BYTES || !sniffImage(bytes)) return null;
			return bytes;
		} catch {
			await wait(500 * (attempt + 1));
		}
	}
	return null;
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
	if (!items.length) return;
	let cursor = 0;
	async function run() {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			await worker(items[index]!);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
}

function wait(ms: number) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function parseArgs(argv: string[]) {
	const options: { database?: string; cache: string; dumps: string[]; mirrorOnly: boolean } = {
		cache: '/tmp/snd-media',
		dumps: [],
		mirrorOnly: false
	};
	for (let index = 0; index < argv.length; index += 1) {
		const flag = argv[index];
		if (flag === '--mirror-only') {
			options.mirrorOnly = true;
			continue;
		}
		if (flag === '--database' || flag === '--cache') {
			const value = argv[index + 1];
			if (!value) throw new Error(`${flag} needs a value`);
			index += 1;
			if (flag === '--database') options.database = value;
			else options.cache = value;
			continue;
		}
		if (flag.startsWith('--')) throw new Error(`Unknown argument ${flag}`);
		options.dumps.push(flag);
	}
	if (!options.dumps.length) throw new Error('Pass one or more Airtable dump JSON files');
	return options;
}
