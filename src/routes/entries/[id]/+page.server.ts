import { error } from '@sveltejs/kit';
import { archiveOpen } from '$lib/auth/access';
import { getCatalog } from '$lib/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	if (!archiveOpen()) error(401, 'Sign in required');
	const entry = await getCatalog().getEntry(params.id);
	if (!entry) error(404, 'That entry is not in the mock catalog.');
	return { entry };
};
