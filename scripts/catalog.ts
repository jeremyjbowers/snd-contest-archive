import { readFileSync } from 'node:fs';
import { fromAirtableDump, type AirtableDump } from '../src/lib/catalog/ingest/airtable.ts';
import { fromAwardForceRows } from '../src/lib/catalog/ingest/award-force.ts';
import { fromFilesCsv } from '../src/lib/catalog/ingest/files.ts';
import { modelFit } from '../src/lib/catalog/ingest/model-fit.ts';
import {
	combineRecords,
	type SourceAsset,
	type SubmissionRecord
} from '../src/lib/catalog/ingest/record.ts';
import { loadCatalog } from '../src/lib/catalog/persist/load.ts';
import { pgSql } from '../src/lib/catalog/persist/pg.ts';
import { readXlsxRows } from './read-xlsx.ts';

type Options = {
	command: 'fit' | 'load';
	awardForce: string[];
	files: string[];
	airtable: string[];
	database?: string;
	includeOverlaps: boolean;
};

const options = parseArgs(process.argv.slice(2));
const loaded = await readSources(options);
const records = combineRecords(loaded.records);
const report = modelFit(records, loaded.assets);

if (options.command === 'fit') {
	console.log(JSON.stringify(report, null, 2));
} else {
	if (!options.database) {
		throw new Error('load needs --database postgres://user:pass@host:5432/snd');
	}
	const result = await loadCatalog(pgSql(options.database), { records, assets: loaded.assets });
	console.log(JSON.stringify({ ...result, fit: report }, null, 2));
}

async function readSources(opts: Options) {
	const records: SubmissionRecord[] = [];
	const assets: SourceAsset[] = [];

	for (const filePath of opts.awardForce) {
		const rows = await readXlsxRows(filePath);
		const mapped = fromAwardForceRows(rows, `award-force:${filePath}`);
		records.push(...mapped.records);
		assets.push(...mapped.assets);
	}
	for (const filePath of opts.files) {
		assets.push(...fromFilesCsv(readFileSync(filePath, 'utf8'), `award-force-files:${filePath}`));
	}
	for (const filePath of opts.airtable) {
		const dump = JSON.parse(readFileSync(filePath, 'utf8')) as AirtableDump;
		const mapped = fromAirtableDump(dump, { includeOverlaps: opts.includeOverlaps });
		if (mapped.skipped) console.error(mapped.skipped);
		records.push(...mapped.records);
		assets.push(...mapped.assets);
	}
	return { records, assets };
}

function parseArgs(argv: string[]): Options {
	const [command, ...rest] = argv;
	if (command !== 'fit' && command !== 'load') {
		throw new Error(
			'Usage: catalog.ts fit|load --award-force file.xlsx --files files.csv --airtable dump.json'
		);
	}
	const options: Options = {
		command,
		awardForce: [],
		files: [],
		airtable: [],
		includeOverlaps: false
	};
	for (let index = 0; index < rest.length; index += 1) {
		const flag = rest[index];
		if (flag === '--include-overlaps') {
			options.includeOverlaps = true;
			continue;
		}
		const value = rest[index + 1];
		if (!value || value.startsWith('--')) throw new Error(`${flag} needs a value`);
		index += 1;
		if (flag === '--award-force') options.awardForce.push(value);
		else if (flag === '--files') options.files.push(value);
		else if (flag === '--airtable') options.airtable.push(value);
		else if (flag === '--database') options.database = value;
		else throw new Error(`Unknown argument ${flag}`);
	}
	return options;
}
