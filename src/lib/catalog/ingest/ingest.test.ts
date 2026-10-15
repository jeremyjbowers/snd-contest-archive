import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createSqlCatalog } from '../adapters/sql-catalog';
import { loadCatalog } from '../persist/load';
import type { Sql } from '../persist/sql';
import { fromAirtableDump } from './airtable';
import { asStoredImage, mediaBytes } from './images';
import { tableDecision, yearFromContest } from './airtable-tables';
import { fromAwardForceRows } from './award-force';
import { parseAwards } from './awards';
import { fromFilesCsv } from './files';
import { modelFit } from './model-fit';
import { combineRecords, toEntry } from './record';

const SECRET_EMAIL = 'secret-entrant@example.com';
const SECRET_PASSWORD = 'hunter2-do-not-store';

test('award ranking keeps every honor and leads with the capstone', () => {
	assert.deepEqual(parseAwards(["World's Best Designed", 'Gold']), ["World's Best", 'Gold']);
	assert.deepEqual(parseAwards('Print, Cover, AOE'), ['Award of Excellence']);
	assert.equal(parseAwards('Medal-discussion, Out').length, 0);
	assert.equal(parseAwards('Best In Show, Gold')[0], 'Best in Show');
});

test('award force rows drop contact fields and paywall secrets', () => {
	const { records, assets } = fromAwardForceRows(
		[
			{
				'Entry ID': 24337,
				Entry: 'City desk',
				Season: 2024,
				'Parent category': '1. Page Design',
				Category: '1i. Sports',
				Platform: 'Print',
				Tags: 'Print, Cover, AOE',
				Descrip: 'A sports page.',
				Credits: 'Ada Lovelace, Designer; Grace Hopper',
				Publication: 'The Daily',
				'Company publication': 'Daily Media',
				'Entry status': 'Submitted',
				'Moderation status': 'approved',
				Email: SECRET_EMAIL,
				Paywall: `username: judge password: ${SECRET_PASSWORD}`,
				'First name': 'Secret',
				'Last name': 'Person',
				'URL 1': 'https://example.com/story',
				'Print attachment': 'YCZ3EClwn6o2J58H'
			}
		],
		'award-force:2024.xlsx'
	);
	const record = records[0];
	assert.equal(record.blockReason, null);
	assert.equal(record.sourceKey, 'af-24337');
	assert.equal(record.awards[0], 'Award of Excellence');
	assert.equal(record.category, 'Sports');
	assert.equal(record.discipline, 'News design');
	assert.equal(record.platform, 'Print');
	assert.equal(record.credits[0]?.role, 'Designer');
	assert.equal(record.publication, 'The Daily');
	const packed = JSON.stringify({ record, assets });
	assert.equal(packed.includes(SECRET_EMAIL), false);
	assert.equal(packed.includes(SECRET_PASSWORD), false);
	assert.equal(packed.includes('Secret'), false);
	assert.equal(
		assets.some((asset) => asset.kind === 'award-force-file'),
		true
	);
	assert.equal(
		assets.some((asset) => asset.locator === 'https://example.com/story'),
		true
	);
});

test('2025 award force categories are topics plus a format, and unjudged rows stay out of the archive', () => {
	const { records } = fromAwardForceRows(
		[
			{
				'Entry ID': 10,
				Entry: 'A pie for every baker',
				Season: 2025,
				'Parent category': '2g. Health & Science',
				Category: '2g. Print: Single page',
				'Entry status': 'Submitted',
				'Moderation status': 'undecided',
				Tags: 'test',
				'Company publication': 'The Paper',
				Descrip: 'Description here'
			}
		],
		'award-force:2025.xlsx'
	);
	const record = records[0];
	assert.equal(record.category, 'Health & Science');
	assert.equal(record.subcategory, 'Single page');
	assert.equal(record.discipline, 'Infographics');
	assert.equal(record.platform, 'Print');
	assert.equal(record.blockReason, 'missing-award');
	assert.equal(toEntry(record), null);
});

test('in-progress submissions are not promoted even with an award tag', () => {
	const { records } = fromAwardForceRows(
		[
			{
				'Entry ID': 11,
				Entry: 'Draft',
				Season: 2024,
				'Parent category': '7. Student Work',
				Category: '7g. Original Illustration',
				Tags: 'Gold',
				Publication: 'School paper',
				'Entry status': 'In progress',
				'Moderation status': 'rejected'
			}
		],
		'award-force:2024.xlsx'
	);
	assert.equal(records[0]?.student, true);
	assert.equal(records[0]?.discipline, 'Illustration & animation');
	assert.equal(records[0]?.blockReason, 'not-submitted');
});

test('file export keeps the expiring locator and drops the entrant email', () => {
	const assets = fromFilesCsv(
		[
			'Original file name,Download URL,File size,File type,Duration,ID,Entry,Slug,Entry ID,Category shortcode,Category,Contest,User ID,Entrant,Email',
			`page.png,https://sndcontests.awardsplatform.com/r/file/abc,1.2 MiB,image/png,,file1,City desk,slug,24337,,Sports,SND46,user1,Secret Person,${SECRET_EMAIL}`
		].join('\n'),
		'award-force-files:2025.csv'
	);
	assert.equal(assets.length, 1);
	assert.equal(assets[0]?.sourceKey, 'af-24337');
	assert.equal(assets[0]?.kind, 'expiring-download');
	assert.equal(assets[0]?.expiresHours, 48);
	assert.equal(assets[0]?.mediaType, 'image/png');
	assert.equal(JSON.stringify(assets).includes(SECRET_EMAIL), false);
});

test('airtable results carry multiple awards and skip roster tables', () => {
	const dumped = fromAirtableDump({
		baseName: 'SND Results',
		tableName: 'SND47 Results',
		records: [
			{
				id: 'rec0123456789abcd',
				fields: {
					Name: 'Trump Tumult',
					'Entry ID': 29830,
					Publication: "Barron's",
					'Company Publication': "Barron's",
					'Parent category': '6. Print-specific Platforms',
					Category: '6a. Newspaper: Front Page',
					Subcategory: '6a. Print: Single page',
					Award: [{ name: 'Gold' }, { name: "World's Best Designed" }],
					Platform: { name: 'Print' },
					Credits: 'Carl Godfrey, Illustrator',
					'Medal Notes': 'A strong front.',
					'L: Digital URL 1': 'https://example.com/tumult'
				}
			}
		]
	});
	const record = dumped.records[0];
	assert.equal(record?.year, 2025);
	assert.deepEqual(record?.awards, ["World's Best", 'Gold']);
	assert.equal(record?.subcategory, 'Single page');
	assert.equal(record?.discipline, 'News design');
	assert.equal(record?.citation, 'A strong front.');
	assert.equal(toEntry(record!)?.description, 'A strong front.');
	assert.equal(toEntry(record!)?.multiWinner, true);
	assert.equal(toEntry(record!)?.award, "World's Best");

	const roster = fromAirtableDump({
		baseName: 'Best of Print News Design',
		tableName: 'SND46 people',
		records: [{ id: 'rec00000000000000', fields: { Name: 'Judge', Email: SECRET_EMAIL } }]
	});
	assert.equal(roster.records.length, 0);
	assert.match(roster.skipped ?? '', /contact/i);
	assert.equal(JSON.stringify(roster).includes(SECRET_EMAIL), false);
});

test('airtable work attachments become previews and social cards stay out', async () => {
	const dumped = fromAirtableDump({
		baseName: 'SND Results',
		tableName: 'SND46 Results',
		records: [
			{
				id: 'rec0123456789abcd',
				fields: {
					Entry: 'City desk',
					'Entry ID': 24337,
					Publication: 'The Daily',
					Award: 'Gold',
					Attachment: [
						{
							url: 'https://v5.airtableusercontent.com/file.pdf',
							filename: 'file.pdf',
							type: 'application/pdf',
							thumbnails: {
								large: {
									url: 'https://v5.airtableusercontent.com/thumb.jpg',
									width: 512,
									height: 700
								}
							}
						},
						{
							url: 'https://v5.airtableusercontent.com/page.png',
							filename: 'page.png',
							type: 'image/png',
							thumbnails: {
								large: { url: 'https://v5.airtableusercontent.com/large.jpg' },
								full: { url: 'https://v5.airtableusercontent.com/full.jpg' }
							}
						}
					],
					'Social Cards': [
						{
							url: 'https://v5.airtableusercontent.com/card.png',
							filename: 'card.png',
							type: 'image/png',
							thumbnails: { large: { url: 'https://v5.airtableusercontent.com/social.jpg' } }
						}
					]
				}
			}
		]
	});
	assert.equal(dumped.assets.length, 2);
	assert.equal(dumped.assets[0]?.locator, 'https://v5.airtableusercontent.com/thumb.jpg');
	assert.equal(dumped.assets[1]?.locator, 'https://v5.airtableusercontent.com/full.jpg');
	assert.equal(
		dumped.assets.every((asset) => asset.kind === 'expiring-download'),
		true
	);
	assert.equal(toEntry(dumped.records[0]!)?.thumbnail, '');

	const stored = dumped.assets.map((asset) => asStoredImage(asset, { mediaType: 'image/jpeg' }));
	const entry = toEntry(dumped.records[0]!, stored);
	assert.deepEqual(entry?.images, ['/media/af-24337/0', '/media/af-24337/1']);

	const db = new PGlite();
	const sql = pgliteSql(db);
	const schema = readFileSync(new URL('../../../../data/postgres.sql', import.meta.url), 'utf8');
	const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
	await loadCatalog(
		sql,
		{
			records: dumped.records,
			assets: stored,
			media: stored.map((asset) => ({
				sourceKey: asset.sourceKey,
				sortOrder: asset.sortOrder,
				mediaType: 'image/jpeg',
				bytes: jpeg
			}))
		},
		schema
	);
	assert.equal((await createSqlCatalog(sql).getEntry('af-24337'))?.thumbnail, '/media/af-24337/0');
	const rows = await sql.query<{ bytes: unknown; media_type: string }>(
		'SELECT bytes, media_type FROM entry_media WHERE entry_id = $1 ORDER BY sort_order',
		['af-24337']
	);
	assert.equal(rows.length, 2);
	assert.equal(rows[0]?.media_type, 'image/jpeg');
	assert.deepEqual(mediaBytes(rows[0]?.bytes), jpeg);

	await loadCatalog(sql, { records: dumped.records, assets: dumped.assets }, schema);
	assert.equal((await createSqlCatalog(sql).getEntry('af-24337'))?.thumbnail, '/media/af-24337/0');
	const kept = await sql.query<{ media_type: string }>(
		'SELECT media_type FROM entry_media WHERE entry_id = $1',
		['af-24337']
	);
	assert.equal(kept.length, 2);
});

test('a markdown entry title is the link label, and screenshots count as the work', () => {
	const dumped = fromAirtableDump({
		baseName: 'Digital results',
		tableName: '2021',
		records: [
			{
				id: 'rec0123456789abcd',
				fields: {
					Entry: '[Quartz’s newsroom accountability bots](https://qz.com/bots)',
					Publication: 'Quartz',
					Award: { name: 'Award of Excellence' },
					'World’s Best Designed™': { name: 'Winner' },
					Screenshots: [
						{
							url: 'https://v5.airtableusercontent.com/shot.png',
							filename: 'shot.png',
							type: 'image/png',
							thumbnails: { full: { url: 'https://v5.airtableusercontent.com/shot-full.jpg' } }
						}
					]
				}
			}
		]
	});
	const record = dumped.records[0];
	assert.equal(record?.title, 'Quartz’s newsroom accountability bots');
	assert.equal(record?.year, 2021);
	assert.equal(record?.platform, 'Digital');
	assert.equal(record?.url, 'https://qz.com/bots');
	assert.deepEqual(record?.awards, ["World's Best", 'Award of Excellence']);
	assert.equal(
		dumped.assets.some((asset) => asset.locator.includes('shot-full')),
		true
	);
	assert.equal(toEntry(record!)?.thumbnail, '');
});

test('older print and digital tables map onto the same record', () => {
	const print = fromAirtableDump({
		baseName: 'Best of Print News Design',
		tableName: 'SND42',
		records: [
			{
				id: 'rec0FrBafDaRB40YX',
				fields: {
					Publication: 'NRC MEDIA',
					Headline: 'The sun, a summer serial',
					'Parent category': 'Category 04 - Special Coverage',
					Category: { name: '4E - Special Coverage: Features' },
					Award: { name: 'Award of Excellence' },
					Credits: 'Design Team NRC'
				}
			}
		]
	});
	assert.equal(yearFromContest(42), 2020);
	assert.equal(print.records[0]?.year, 2020);
	assert.equal(print.records[0]?.platform, 'Print');
	assert.equal(print.records[0]?.discipline, 'News design');
	assert.equal(print.records[0]?.title, 'The sun, a summer serial');

	const digital = fromAirtableDump(
		{
			baseName: 'Digital results',
			tableName: 'Archive',
			records: [
				{
					id: 'rec017bIJl6jFeCWV',
					fields: {
						Headline: 'Malaysia’s 1MDB Decoded',
						Entry: '[Malaysia’s 1MDB Decoded](http://example.com/1mdb)',
						Award: { name: 'Award of Excellence' },
						Publication: 'The Wall Street Journal',
						'Work published in': '2015',
						URL: 'http://example.com/1mdb',
						'General Category Name': { name: 'Graphics: Features and planned coverage' }
					}
				}
			]
		},
		{ includeOverlaps: true }
	);
	assert.equal(digital.records[0]?.title, 'Malaysia’s 1MDB Decoded');
	assert.equal(digital.records[0]?.year, 2015);
	assert.equal(digital.records[0]?.discipline, 'Infographics');
	assert.equal(digital.records[0]?.platform, 'Digital');
	assert.equal(tableDecision('zzTestResults').hardRefuse, true);
	assert.equal(tableDecision('2023 (SND45)', 'Digital results').year, 2023);
	assert.equal(tableDecision('2023 (SND45)', 'Digital results').platformDefault, 'Digital');
});

test('airtable awards replace award force tags for the same entry id', () => {
	const awardForce = fromAwardForceRows(
		[
			{
				'Entry ID': 29830,
				Entry: 'Trump Tumult',
				Season: 2025,
				'Parent category': '6. Print-specific Platforms',
				Category: '6a. Newspaper: Front Page',
				'Entry status': 'Submitted',
				'Moderation status': 'approved',
				Tags: 'AOE',
				Publication: "Barron's",
				Descrip: 'Entrant description'
			}
		],
		'award-force:2025.xlsx'
	);
	const airtable = fromAirtableDump({
		baseName: 'SND Results',
		tableName: 'SND47 Results',
		records: [
			{
				id: 'rec0123456789abcd',
				fields: {
					Name: 'Trump Tumult',
					'Entry ID': 29830,
					Publication: "Barron's",
					Award: ['Gold'],
					'Medal Notes': 'Judges liked the type.'
				}
			}
		]
	});
	const [merged] = combineRecords([...awardForce.records, ...airtable.records]);
	assert.deepEqual(merged?.awards, ['Gold']);
	assert.equal(merged?.description, 'Entrant description');
	assert.equal(merged?.citation, 'Judges liked the type.');
	assert.equal(merged?.blockReason, null);
});

test('model fit counts rows the entry model cannot publish', () => {
	const { records } = fromAwardForceRows(
		[
			{
				'Entry ID': 1,
				Entry: 'No medal',
				Season: 2025,
				Publication: 'Paper',
				'Entry status': 'Submitted',
				'Moderation status': 'approved'
			}
		],
		'award-force:sample.xlsx'
	);
	const fit = modelFit(records);
	assert.equal(fit.promotable, 0);
	assert.equal(fit.blocked['missing-award'], 1);
});

test('postgres loader promotes winners and stores secrets nowhere', async () => {
	const db = new PGlite();
	const sql = pgliteSql(db);
	const schema = readFileSync(new URL('../../../../data/postgres.sql', import.meta.url), 'utf8');
	const awardForce = fromAwardForceRows(
		[
			{
				'Entry ID': 50,
				Entry: 'Published piece',
				Season: 2024,
				'Parent category': '2. Infographics',
				Category: '2e. Environment & Science',
				Platform: 'Digital',
				Tags: "Gold, World's Best Designed",
				Publication: 'The Paper',
				Descrip: 'A graphic.',
				Credits: 'Ada Lovelace, Designer',
				'Entry status': 'Submitted',
				'Moderation status': 'approved',
				Email: SECRET_EMAIL,
				Paywall: SECRET_PASSWORD,
				'URL 1': 'https://example.com/graphic'
			},
			{
				'Entry ID': 51,
				Entry: 'Still judging',
				Season: 2025,
				Publication: 'The Paper',
				'Entry status': 'Submitted',
				'Moderation status': 'undecided',
				Email: SECRET_EMAIL
			}
		],
		'award-force:test.xlsx'
	);
	const files = fromFilesCsv(
		`Original file name,Download URL,File size,File type,Duration,ID,Entry,Slug,Entry ID,Category shortcode,Category,Contest,User ID,Entrant,Email
shot.png,https://sndcontests.awardsplatform.com/r/file/shot,800 KiB,image/png,,f,Published piece,s,50,,Infographics,SND46,u,Secret,${SECRET_EMAIL}`,
		'award-force-files:test.csv'
	);
	await loadCatalog(
		sql,
		{ records: awardForce.records, assets: [...awardForce.assets, ...files] },
		schema
	);

	const catalog = createSqlCatalog(sql);
	const winner = await catalog.getEntry('af-50');
	assert.equal(winner?.award, "World's Best");
	assert.equal(winner?.awards.includes('Gold'), true);
	assert.equal(winner?.discipline, 'Infographics');
	assert.equal(winner?.credits[0]?.name, 'Ada Lovelace');
	assert.equal(await catalog.getEntry('af-51'), null);

	const worldsBest = await catalog.listEntries({ awards: ["World's Best"] });
	assert.equal(worldsBest.length, 1);
	const gold = await catalog.listEntries({ awards: ['Gold'] });
	assert.equal(gold.length, 1);

	const stored = await sql.query<{ payload: string }>('SELECT payload FROM source_submissions');
	const assets = await sql.query<{ locator: string; kind: string }>(
		'SELECT locator, kind FROM source_assets'
	);
	const packed = JSON.stringify({ stored, assets });
	assert.equal(packed.includes(SECRET_EMAIL), false);
	assert.equal(packed.includes(SECRET_PASSWORD), false);
	assert.equal(
		assets.some((asset) => asset.kind === 'expiring-download'),
		true
	);

	const again = await loadCatalog(
		sql,
		{ records: awardForce.records, assets: awardForce.assets },
		schema
	);
	assert.equal(again.promoted, 1);
	assert.equal((await catalog.listEntries()).length, 1);
});

function pgliteSql(db: PGlite): Sql {
	return {
		async query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
			const result = await db.query(text, params as never[]);
			return result.rows as T[];
		},
		async exec(text) {
			await db.exec(text);
		}
	};
}
