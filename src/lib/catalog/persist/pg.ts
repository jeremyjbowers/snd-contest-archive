import type { Sql } from './sql';

type PgPool = {
	query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
};

const pools = new Map<string, Promise<PgPool>>();

/**
 * One pool per connection string. The smallest managed Postgres allows about
 * twenty connections, so a new pool on every request would exhaust it.
 */
export function pgSql(connectionString: string): Sql {
	const pool = () => {
		let pending = pools.get(connectionString);
		if (!pending) {
			pending = import('pg').then(
				({ Pool }) => new Pool(poolOptions(connectionString)) as unknown as PgPool
			);
			pools.set(connectionString, pending);
		}
		return pending;
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

export function poolOptions(connectionString: string): {
	connectionString: string;
	ssl?: { rejectUnauthorized: boolean };
} {
	const needsSsl = /[?&]sslmode=(?:require|prefer|verify-ca|verify-full)(?:&|$)/.test(
		connectionString
	);
	if (!needsSsl) return { connectionString };
	// DigitalOcean's certificate is not in Node's default trust store.
	return { connectionString, ssl: { rejectUnauthorized: false } };
}
