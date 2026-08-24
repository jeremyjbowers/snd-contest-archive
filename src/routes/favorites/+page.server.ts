import { getCatalog } from '$lib/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const entries = await getCatalog().listEntries();
	return { entries };
};
