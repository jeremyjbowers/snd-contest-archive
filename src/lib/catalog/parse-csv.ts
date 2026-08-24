/** Tiny CSV parser that understands quotes and escaped quotes. */
export function parseCsv(text: string): Record<string, string>[] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;

	const pushField = () => {
		row.push(field);
		field = '';
	};
	const pushRow = () => {
		if (row.length === 1 && row[0] === '') {
			row = [];
			return;
		}
		rows.push(row);
		row = [];
	};

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		const next = text[i + 1];
		if (quoted) {
			if (char === '"' && next === '"') {
				field += '"';
				i += 1;
			} else if (char === '"') {
				quoted = false;
			} else {
				field += char;
			}
			continue;
		}
		if (char === '"') {
			quoted = true;
		} else if (char === ',') {
			pushField();
		} else if (char === '\n') {
			pushField();
			pushRow();
		} else if (char !== '\r') {
			field += char;
		}
	}
	pushField();
	pushRow();

	if (!rows.length) return [];
	const [header, ...body] = rows;
	return body.map((values) => {
		const record: Record<string, string> = {};
		header.forEach((key, index) => {
			record[key.trim()] = (values[index] ?? '').trim();
		});
		return record;
	});
}
