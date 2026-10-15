import { getCatalog } from '$lib/catalog';
import { pageOf } from '$lib/catalog/page';
import { browseEntries } from '$lib/catalog/shuffle';
import { queryFromSearchParams } from '$lib/catalog/url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const catalog = getCatalog();
	const query = queryFromSearchParams(url.searchParams);
	const [entries, facets] = await Promise.all([catalog.listEntries(query), catalog.getFacets()]);
	const browse = browseEntries(entries, query, null);
	const page = pageOf(browse.ordered, 0);

	return { entries: page.entries, total: page.total, facets, query, bucket: browse.bucket };
};
