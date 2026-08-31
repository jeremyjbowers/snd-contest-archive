import { getCatalog } from '$lib/catalog';
import { queryFromSearchParams } from '$lib/catalog/url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const catalog = getCatalog();
	const query = queryFromSearchParams(url.searchParams);
	const [entries, facets] = await Promise.all([catalog.listEntries(query), catalog.getFacets()]);

	return { entries, facets, query };
};
