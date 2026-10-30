import { getInventory, presentClass } from '$lib/admin/inventory';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return { rows: getInventory().classes.map(presentClass) };
};
