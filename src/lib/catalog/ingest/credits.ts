import type { Credit } from '../types';
import { asText, isBlank } from './text';

/** Best-effort split of "Name, Role; Name, Role" and one-name lines. */
export function parseCreditLine(value: unknown): Credit[] {
	const text = asText(value);
	if (isBlank(text)) return [];
	return text
		.split(/;|\||\n|\r/)
		.map((chunk) => chunk.trim())
		.filter((chunk) => !isBlank(chunk))
		.map((chunk) => {
			const comma = chunk.indexOf(',');
			if (comma > 0) {
				return { name: chunk.slice(0, comma).trim(), role: chunk.slice(comma + 1).trim() };
			}
			return { name: chunk, role: '' };
		})
		.filter((credit) => credit.name);
}
