import { getCatalog } from '$lib/catalog';
import { pageOf } from '$lib/catalog/page';
import { browseEntries, isOpenBrowse, openBrowse } from '$lib/catalog/shuffle';
import { queryFromSearchParams } from '$lib/catalog/url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = queryFromSearchParams(url.searchParams);
	if (isOpenBrowse(query)) {
		const home = await openBrowse(loadOpenCatalog);
		const page = pageOf(home.ordered, 0);
		return {
			entries: page.entries,
			total: page.total,
			facets: home.facets,
			query,
			bucket: home.bucket
		};
	}

	const catalog = getCatalog();
	const [entries, facets] = await Promise.all([catalog.listEntries(query), catalog.getFacets()]);
	const browse = browseEntries(entries, query, null);
	const page = pageOf(browse.ordered, 0);
	return { entries: page.entries, total: page.total, facets, query, bucket: browse.bucket };
};

async function loadOpenCatalog() {
	const catalog = getCatalog();
	const [entries, facets] = await Promise.all([catalog.listEntries(), catalog.getFacets()]);
	return { entries, facets };
}
