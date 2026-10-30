import { getInventory } from '$lib/admin/inventory';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const inventory = getInventory();
	return {
		readOn: inventory.readOn,
		entries: inventory.entries,
		sources: inventory.sources,
		honorEntries: inventory.honorEntries,
		fields: inventory.fields
	};
};
