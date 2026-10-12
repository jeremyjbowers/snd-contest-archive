const BLANKS = new Set(['', '—', '-', '–', 'n/a', 'na', 'none', 'null']);

/** Flatten a spreadsheet or Airtable cell to trimmed text. */
export function asText(value: unknown): string {
	if (value == null) return '';
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value);
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (value instanceof Date) return value.toISOString();
	if (Array.isArray(value))
		return value
			.map((item) => asText(item))
			.filter(Boolean)
			.join(', ');
	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		if (Array.isArray(obj.richText))
			return obj.richText
				.map((item) => asText(item))
				.join('')
				.trim();
		if ('result' in obj && obj.result != null) return asText(obj.result);
		if (typeof obj.text === 'string' && obj.text.trim()) return obj.text.trim();
		if (typeof obj.name === 'string') return obj.name.trim();
		if (typeof obj.url === 'string') return obj.url.trim();
	}
	return '';
}

export function isBlank(value: unknown): boolean {
	return BLANKS.has(asText(value).toLowerCase());
}

export function checked(value: unknown): boolean {
	if (value === true) return true;
	const text = asText(value).toLowerCase();
	return text === '✓' || text === '✔' || text === 'true' || text === 'yes' || text === '1';
}

/** Select values, multi-selects, and comma-separated tags. */
export function asList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => asText(item)).filter((item) => !isBlank(item));
	}
	const text = asText(value);
	if (isBlank(text)) return [];
	return [text];
}

export function asUrl(value: unknown): string {
	if (typeof value === 'object' && value && 'url' in value) {
		const url = asText((value as { url: unknown }).url);
		if (/^https?:\/\//i.test(url)) return url;
	}
	const text = asText(value);
	return /^https?:\/\//i.test(text) ? text : '';
}

export function column(row: Record<string, unknown>, ...names: string[]): unknown {
	const wanted = new Set(names.map((name) => name.toLowerCase()));
	for (const [key, value] of Object.entries(row)) {
		if (wanted.has(key.toLowerCase()) && !isBlank(value)) return value;
	}
	return undefined;
}
