export interface Sql {
	query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
	exec(sql: string): Promise<void>;
}

export function sqlStatements(sql: string): string[] {
	return sql
		.replace(/--[^\n]*/g, '')
		.split(';')
		.map((statement) => statement.trim())
		.filter(Boolean);
}

export async function applySchema(sql: Sql, schema: string) {
	for (const statement of sqlStatements(schema)) {
		await sql.exec(statement);
	}
}
