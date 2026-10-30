import { error } from '@sveltejs/kit';
import { fieldById } from '$lib/admin/inventory';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const found = fieldById(params.field);
	if (!found) error(404, 'No field with that name');
	return found;
};
