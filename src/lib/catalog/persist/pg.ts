import type { Sql } from './sql';

/** Lazy `pg` pool so importing the catalog does not open a connection. */
export function pgSql(connectionString: string): Sql {
	let poolPromise: Promise<{
		query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
	}> | null = null;
	const pool = () => {
		poolPromise ??= import('pg').then(({ Pool }) => new Pool({ connectionString }));
		return poolPromise;
	};

	return {
		async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
			const client = await pool();
			const result = await client.query(sql, params);
			return result.rows as T[];
		},
		async exec(sql) {
			const client = await pool();
			await client.query(sql);
		}
	};
}
