import { parseCsv } from '../parse-csv';
import { awardForceKey } from './award-force';
import type { SourceAsset } from './record';
import { asText, isBlank } from './text';

export type { SourceAsset };

/**
 * Award Force's file export is a download list. The URLs expire about 48 hours
 * after they are generated, and the sheet repeats the entrant's email.
 * Only the locator, filename, and type are kept.
 */
export function fromFilesCsv(text: string, origin: string): SourceAsset[] {
	const counts = new Map<string, number>();
	const assets: SourceAsset[] = [];
	for (const row of parseCsv(text)) {
		const entryId = row['Entry ID']?.trim();
		const locator = row['Download URL']?.trim();
		if (!entryId || !locator || isBlank(locator)) continue;
		const sourceKey = awardForceKey(entryId);
		const sortOrder = counts.get(sourceKey) ?? 0;
		counts.set(sourceKey, sortOrder + 1);
		assets.push({
			sourceKey,
			origin,
			sortOrder,
			kind: 'expiring-download',
			label: asText(row['Original file name']) || 'file',
			filename: asText(row['Original file name']) || null,
			mediaType: asText(row['File type']) || null,
			byteSize: asText(row['File size']) || null,
			locator,
			expiresHours: 48
		});
	}
	return assets;
}
