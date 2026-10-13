import { getCatalog } from '$lib/catalog';
import { byArchiveOrder, pageOf } from '$lib/catalog/page';
import { queryFromSearchParams } from '$lib/catalog/url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const catalog = getCatalog();
	const query = queryFromSearchParams(url.searchParams);
	const [entries, facets] = await Promise.all([catalog.listEntries(query), catalog.getFacets()]);
	const page = pageOf(byArchiveOrder(entries), 0);

	return { entries: page.entries, total: page.total, facets, query };
};
