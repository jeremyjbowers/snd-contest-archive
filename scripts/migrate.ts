import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pgSql } from '../src/lib/catalog/persist/pg.ts';
import { applySchema } from '../src/lib/catalog/persist/sql.ts';

const url = process.env.CATALOG_URL || process.env.DATABASE_URL;
if (!url || !/^postgres(ql)?:\/\//.test(url)) {
	throw new Error('Set CATALOG_URL or DATABASE_URL to a postgres:// connection string.');
}

await applySchema(pgSql(url), readFileSync(resolve('data/postgres.sql'), 'utf8'));
console.log('Postgres schema applied');
