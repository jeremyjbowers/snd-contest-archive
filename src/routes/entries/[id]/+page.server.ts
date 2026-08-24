import { error } from '@sveltejs/kit';
import { getCatalog } from '$lib/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const entry = await getCatalog().getEntry(params.id);
	if (!entry) error(404, 'That entry is not in the mock catalog.');
	return { entry };
};
