import { env } from '$env/dynamic/private';
import { getCatalog } from '$lib/catalog';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const url = env.CATALOG_URL ?? 'csv:data/entries.csv';
	const kind = url.startsWith('postgres')
		? 'postgres'
		: url.startsWith('sqlite')
			? 'sqlite'
			: 'csv';
	try {
		const entries = await getCatalog().listEntries();
		return { catalog: { kind, entries: entries.length } };
	} catch {
		return { catalog: { kind, entries: null } };
	}
};
