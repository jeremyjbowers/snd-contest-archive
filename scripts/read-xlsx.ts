import ExcelJS from 'exceljs';
import { asText } from '../src/lib/catalog/ingest/text.ts';

/** Read the first sheet of an Award Force export into header-keyed rows. */
export async function readXlsxRows(filePath: string): Promise<Record<string, unknown>[]> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(filePath);
	const sheet = workbook.worksheets[0];
	if (!sheet) return [];

	const header: string[] = [];
	const seen = new Map<string, number>();
	sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
		const raw = asText(cell.value).trim() || `column_${col}`;
		const count = (seen.get(raw) ?? 0) + 1;
		seen.set(raw, count);
		header[col] = count === 1 ? raw : `${raw}#${count}`;
	});

	const rows: Record<string, unknown>[] = [];
	sheet.eachRow((row, rowNumber) => {
		if (rowNumber === 1) return;
		const record: Record<string, unknown> = {};
		row.eachCell({ includeEmpty: false }, (cell, col) => {
			const key = header[col];
			if (!key) return;
			record[key] = cell.value;
		});
		if (Object.keys(record).length) rows.push(record);
	});
	return rows;
}
