import { loadBrowse } from '$lib/catalog/browse';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => loadBrowse(url);
